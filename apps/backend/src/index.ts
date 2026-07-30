import express, { Request, Response } from 'express';
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv'

// Middleware
import { idempotencyMiddleware } from './middlewares/idempotency';
// Repositories
import { PaymentRepository } from './modules/payment/payment.repository';
// Services
import { RouterService } from './modules/router/router.service';
import { WebhookService } from './modules/webhook/webhook.service';
import { AnalyticsService } from './modules/analytics/analytics.service';
// Controllers
import { WebhookController } from './modules/webhook/webhook.controller';
import { AnalyticsController } from './modules/analytics/analytics.controller';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config()

// 1. Global Middleware
app.use(express.json()); // Parse JSON bodies

async function bootstrap() {
  try {
    // 2. Initialize Pure SQL Database Pool
    const dbPool = createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'api_user',
      password: process.env.DB_PASSWORD || 'apipassword',
      database: process.env.DB_NAME || 'payment_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Database pool initialized successfully.');

    // 3. Instantiate Repositories
    const paymentRepo = new PaymentRepository(dbPool);
    // 4. Instantiate Services
    const routerService = new RouterService();
    const webhookService = new WebhookService(dbPool, paymentRepo);
    // 5. Instantiate Controllers
    const webhookController = new WebhookController(webhookService);

    const analyticsService = new AnalyticsService(dbPool);
    const analyticsController = new AnalyticsController(analyticsService);

    // 6. Define Routes

    // Health Check
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
    });

    // Payment Initialization Route (Protected by Idempotency Middleware)
    app.post('/api/v1/payments', idempotencyMiddleware, async (req: Request, res: Response) => {
      try {
        const { amount, currency } = req.body;

        // Step A: Create transaction in database
        const transactionId = await paymentRepo.createTransaction(amount, currency);

        // Step B: Fetch live gateway metrics (Simulated here)
        const liveGateways = [
          { id: 'stripe', successRate: 0.99, latencyMs: 150, costPercentage: 0.029, isHealthy: true },
          { id: 'razorpay', successRate: 0.95, latencyMs: 200, costPercentage: 0.020, isHealthy: true }
        ];

        // Step C: Route mathematically via Max-Heap Priority Queue
        const optimalGateway = routerService.getOptimalGetway(liveGateways);

        if (!optimalGateway) {
          res.status(503).json({ error: 'No healthy payment gateways available' });
          return;
        }

        // Step D: Safely update state to ROUTED
        await paymentRepo.updateTransactionState(transactionId, 'ROUTED', `Routed to ${optimalGateway.id}`);

        res.status(201).json({
          transactionId,
          routedTo: optimalGateway.id,
          status: 'ROUTED'
        });
      } catch (error: any) {
        console.error('Payment Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Webhook Route (Stripe Example)
    app.post('/api/v1/webhooks/stripe', webhookController.handleStripeWebhook);

    app.get('/api/v1/analytics/dashboard', analyticsController.getDashboardMetrics);

    // 7. Start the Server
    app.listen(PORT, () => {
      console.log(`Payment Orchestrator API running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error('Failed to bootstrap the application:', error);
    process.exit(1);
  }
}

// Execute the bootstrap sequence
bootstrap();