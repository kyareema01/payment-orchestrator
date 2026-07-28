import { PriorityQueue } from '../../dsa/PriorityQueue';

export interface GetwayMetrics {
  id: string;
  successRate: number; // 0.0 to 1.0
  latencyMs: number;
  costPercentage: number; // e.g., 0.015 for 1.5%
  isHealthy: boolean;
}

export class RouterService {
  // Configurable weights (Must sum to 1.0)
 private readonly WEIGHT_SUCCESS = 0.60
 private readonly WEIGHT_LATENCY = 0.20
 private readonly WEIGHT_COST = 0.20
 private readonly TARGET_LATENCY_MS = 100
 
 /**
   * Calculates the normalized score for a single gateway
   */

 public calculateScore(metrics: GetwayMetrics): number {
  if (!metrics.isHealthy) return 0

  // 1. Success Rate (already 0-1, higher is better)
  const successScore = metrics.successRate
  // 2. Normalize Latency (invert so lower ms = higher score)
  const latencyScore = Math.min(1.0, this.TARGET_LATENCY_MS / metrics.latencyMs)
  // 3. Normalize Cost (invert so lower cost = higher score)
  const costScore = 1.0 - metrics.costPercentage
  // Apply the weighted equation

  const totalScore = 
  (this.WEIGHT_SUCCESS * successScore) +
  (this.WEIGHT_LATENCY * latencyScore) +
  (this.WEIGHT_COST * costScore);

  return totalScore
 }

 public getOptimalGetway(getways: GetwayMetrics[]): GetwayMetrics | null {
  if (getways.length === 0) return null

  // priorityQueue
  const pq = new PriorityQueue<GetwayMetrics>();

  for (let getway of getways) {
    const score = this.calculateScore(getway)
    if (score > 0) {
      pq.enqueue(getway, score)
    }
  }

  //extract the root node in O(n) time
  return pq.dequeue();
 }
}