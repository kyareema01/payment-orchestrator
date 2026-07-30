import { Request, Response } from 'express';
import { WebhookService } from './webhook.service';

export class WebhookController {
  constructor(private webhookService: WebhookService) {}

  public async handleStripeWebhook(req: Request, res: Response): Promise<void> {
    // 1. In a production app, I shouldn't forget to verify the cryptographic signature here first
    
    const { id: eventId, data, type } = req.body; 
    const transactionId = data.object.metadata.transactionId;

    try {
      if (type === 'payment_intent.succeeded') {
        await this.webhookService.processGatewayWebhook(eventId, transactionId, 'SUCCESS');
      } else if (type === 'payment_intent.payment_failed') {
        await this.webhookService.processGatewayWebhook(eventId, transactionId, 'FAILED');
      }

      // 2. Always return a 200 OK fast so the gateway knows we got it
      res.status(200).send('Webhook processed');
    } catch (error) {
      // If I throw 500, Stripe will try to send the webhook again later
      res.status(500).send('Internal Server Error');
    }
  }
}