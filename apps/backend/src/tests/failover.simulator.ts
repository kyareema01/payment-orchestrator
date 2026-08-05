import { RouterService, GetwayMetrics } from '../modules/router/router.service';
import { CircuitBreaker } from '../modules/router/circuit-breaker';

const router = new RouterService();

// Initialize Circuit Breakers for my gateways
const stripeBreaker = new CircuitBreaker('stripe');
const razorpayBreaker = new CircuitBreaker('razorpay');

// Simulated Live Metrics
let liveGateways: GetwayMetrics[] = [
  { id: 'razorpay', successRate: 0.98, latencyMs: 120, costPercentage: 0.02, isHealthy: true },
  { id: 'stripe', successRate: 0.99, latencyMs: 150, costPercentage: 0.029, isHealthy: true }
];

async function simulateTraffic() {
  console.log('🚀 Starting Traffic Simulation...\n');

  for (let i = 1; i <= 5; i++) {
    console.log(`--- Transaction Attempt ${i} ---`);
    
    // Update health status based on Circuit Breaker state
    liveGateways = liveGateways.map(g => {
      const breaker = g.id === 'stripe' ? stripeBreaker : razorpayBreaker;
      return { ...g, isHealthy: breaker.isHealthy() };
    });

    const optimalGateway = router.getOptimalGetway(liveGateways);
    
    if (!optimalGateway) {
      console.log('❌ FATAL: All gateways are down.');
      break;
    }

    console.log(`✅ Max-Heap Selected: ${optimalGateway.id}`);

    // SIMULATE A CRASH: Razorpay fails on attempt 2, 3, and 4
    if (optimalGateway.id === 'razorpay' && i >= 2 && i <= 4) {
      try {
        await razorpayBreaker.execute(async () => {
          throw new Error('503 Service Unavailable'); // Simulate API timeout
        });
      } catch (e: any) {
        console.log(`⚠️  Network Error: ${e.message}`);
      }
    } else {
      // Simulate success
      const breaker = optimalGateway.id === 'stripe' ? stripeBreaker : razorpayBreaker;
      await breaker.execute(async () => {
        console.log(`💰 Payment captured successfully via ${optimalGateway.id}`);
      });
    }
    console.log('');
  }
}

simulateTraffic();