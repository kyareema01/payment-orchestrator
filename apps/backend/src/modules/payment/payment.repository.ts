import { Pool, PoolConnection } from 'mysql2/promise';
import { PaymentState, PaymentStateMachine } from './payment.state-machine';
import { randomUUID } from 'crypto';

export class PaymentRepository {
  constructor(private dbPool: Pool) {}

  // 1. Initialize a new payment in 'CREATED' state
  async createTransaction(amount: number, currency: string = 'NGN'): Promise<string> {
    const transactionId = randomUUID();
    
    await this.dbPool.execute(
      `INSERT INTO transactions (id, amount, currency, state) VALUES (?, ?, ?, 'CREATED')`,
      [transactionId, amount, currency]
    );

    // Log the creation event
    await this.dbPool.execute(
      `INSERT INTO transaction_events (id, transaction_id, previous_state, new_state, event_reason) 
       VALUES (?, ?, NULL, 'CREATED', 'Initial Creation')`,
      [randomUUID(), transactionId]
    );

    return transactionId;
  }

  // 2. Safely progress the transaction state
  async updateTransactionState( transactionId: string, newState: PaymentState, reason: string ): Promise<void> {
    const connection: PoolConnection = await this.dbPool.getConnection();

    try {
      await connection.beginTransaction();

      // Lock the specific row so concurrent webhooks/retries wait their turn
      const [rows]: any = await connection.execute(
        `SELECT state FROM transactions WHERE id = ? FOR UPDATE`,
        [transactionId]
      );

      if (rows.length === 0) throw new Error('Transaction not found');
      
      const currentState: PaymentState = rows[0].state;

      // Validate transition via State Machine graph
      if (!PaymentStateMachine.canTransition(currentState, newState)) {
        throw new Error(`Illegal state transition from ${currentState} to ${newState}`);
      }

      // Execute State Update
      await connection.execute(
        `UPDATE transactions SET state = ? WHERE id = ?`,
        [newState, transactionId]
      );

      // Insert Audit Event
      await connection.execute(
        `INSERT INTO transaction_events (id, transaction_id, previous_state, new_state, event_reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [randomUUID(), transactionId, currentState, newState, reason]
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}