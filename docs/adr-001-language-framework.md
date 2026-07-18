# ADR 001: Selection of Language and Framework

**Date:** 2026-07-18
**Status:** Accepted

## Context
The ZethetaIntern Payment Orchestrator requires a high-throughput backend capable of handling asynchronous webhook processing, mathematical routing across multiple gateways (Stripe, Razorpay, PayU), and strict state management. 

## Decision
I have decided to build a **Modular Monolith** using **Node.js with TypeScript** and **Express.js**.

## Rationale
1. **Asynchronous I/O:** Node.js's event-driven, non-blocking I/O is inherently designed to handle thousands of concurrent network requests (e.g., waiting for third-party gateways) without consuming excessive thread memory.
2. **Type Safety:** TypeScript enforces strict interfaces for our mathematical routing formulas and data structures (Max-Heap), preventing runtime errors.
3. **Modular Monolith over Microservices:** Given the 15-day timeline, managing distributed infrastructure (message brokers, distributed tracing) adds unnecessary DevOps overhead. A modular monolith provides the logical separation of microservices while keeping deployment simple.

## Consequences
*   **Positive:** Rapid development cycle, excellent ecosystem for API development, shared language across frontend (Next.js) and backend.
*   **Negative:** CPU-intensive tasks (if added later) could block the event loop, requiring worker threads in the future.