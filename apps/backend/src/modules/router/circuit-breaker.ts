export type BreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export class CircuitBreaker {
  public state: BreakerState = 'CLOSED';
  private failureCount: number = 0;
  private nextAttempt: number = Date.now();

  // Configuration
  private readonly failureThreshold = 3; // Trip after 3 consecutive failures
  private readonly recoveryTimeout = 5000; // Wait 5 seconds before testing again

  constructor(public readonly gatewayId: string) {}

  /**
   * Wraps the outbound HTTP call to the payment gateway
   */
  public async execute(action: () => Promise<any>): Promise<any> {
    if (this.state === 'OPEN') {
      if (Date.now() > this.nextAttempt) {
        this.state = 'HALF_OPEN'; // Time to test if the gateway is back online
      } else {
        throw new Error(`Circuit breaker is OPEN for gateway: ${this.gatewayId}`);
      }
    }

    try {
      const response = await action();
      this.onSuccess();
      return response;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED'; // Gateway is healthy
  }

  private onFailure(): void {
    this.failureCount++;
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
      console.log(`[Circuit Breaker] TRIPPED for ${this.gatewayId}! Rerouting traffic.`);
    }
  }

  public isHealthy(): boolean {
    return this.state === 'CLOSED' || this.state === 'HALF_OPEN';
  }
}