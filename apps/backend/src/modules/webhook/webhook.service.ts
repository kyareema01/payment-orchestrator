import { Pool } from 'mysql2/promise';
import { PaymentRepository } from '../payment/payment.repository';

export class WebhookService {
  constructor(
    private dbPool: Pool,
    private paymentRepo: PaymentRepository
  ) {}

  public async processGatewayWebhook(eventId: string, transactionId: string, gatewayStatus: string): Promise<void> {
    const connection = await this.dbPool.getConnection();

    try {
      // 1. Deduplication Check (Idempotency for Webhooks)
      // Check if we already processed this exact event_id
      const [existingEvent]: any = await connection.execute(
        `SELECT id FROM transaction_events WHERE id = ?`,
        [eventId]
      );

      if (existingEvent.length > 0) {
        console.log(`[Webhook] Duplicate event ${eventId} intercepted. Ignoring.`);
        return; // Acknowledge the webhook but do nothing
      }

      // 2. Map Gateway Status to our Internal State Machine
      let newState: 'CAPTURED' | 'FAILED';
      if (gatewayStatus === 'SUCCESS' || gatewayStatus === 'paid') {
        newState = 'CAPTURED';
      } else {
        newState = 'FAILED';
      }

      // 3. Trigger the Pure SQL Repository to safely lock the row and update the state
      await this.paymentRepo.updateTransactionState(
        transactionId,
        newState,
        `Webhook received: ${eventId}`
      );

    } catch (error) {
      console.error(`[Webhook] Processing failed for event ${eventId}:`, error);
      throw error;
    } finally {
      connection.release();
    }
  }
}