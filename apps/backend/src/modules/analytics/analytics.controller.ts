import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  public getDashboardMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const volume = await this.analyticsService.getGatewayVolume();
      const successRates = await this.analyticsService.getGatewaySuccessRates();

      res.status(200).json({
        timestamp: new Date().toISOString(),
        metrics: {
          volume,
          successRates
        }
      });
    } catch (error) {
      console.error('[Analytics Error]', error);
      res.status(500).json({ error: 'Failed to fetch analytics' });
    }
  }
}