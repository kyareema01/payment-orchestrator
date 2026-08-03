import { Pool } from 'mysql2/promise';

export class AnalyticsService {
  constructor(private dbPool: Pool) {}

  /**
   * Get total transaction volume and count grouped by gateway
   */
  public async getGatewayVolume(): Promise<any> {
    const query = `
      SELECT 
        gateway_id, 
        COUNT(id) as total_transactions, 
        SUM(amount) as total_volume_ngn
      FROM transactions 
      WHERE gateway_id IS NOT NULL
      GROUP BY gateway_id
      ORDER BY total_volume_ngn DESC;
    `;
    
    const [rows] = await this.dbPool.execute(query);
    return rows;
  }

  /**
   * Calculate success rate (CAPTURED vs FAILED) per gateway
   */
  public async getGatewaySuccessRates(): Promise<any> {
    const query = `
      SELECT 
        gateway_id,
        COUNT(CASE WHEN state = 'CAPTURED' THEN 1 END) as successful,
        COUNT(CASE WHEN state = 'FAILED' THEN 1 END) as failed,
        COUNT(id) as total,
        (COUNT(CASE WHEN state = 'CAPTURED' THEN 1 END) / COUNT(id)) * 100 as success_rate_percentage
      FROM transactions
      WHERE gateway_id IS NOT NULL
      GROUP BY gateway_id;
    `;

    const [rows] = await this.dbPool.execute(query);
    return rows;
  }
}