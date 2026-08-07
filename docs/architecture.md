# System Architecture Document

## 1. High-Level Architecture
The ZethetaIntern Payment Orchestrator is designed as a **Modular Monolith**. It provides the logical separation of microservices (Routing, Processing, Webhooks) while executing within a single Node.js runtime to minimize DevOps overhead. The system uses a Next.js frontend for analytics and a pure MySQL database for persistence.

## 2. Core System Components

### A. The API Gateway & Idempotency Layer
*   **Technology:** Express.js middleware, SHA-256 Hashing.
*   **Function:** Intercepts all incoming requests. Hashes the `Idempotency-Key` header and checks an in-memory map. Provides $O(1)$ lookup time to instantly reject duplicate client requests (e.g., double-clicks), ensuring exactly-once processing.

### B. The Intelligent Routing Engine
*   **Technology:** Custom Max-Heap (Priority Queue).
*   **Function:** Evaluates available payment gateways (Stripe, Razorpay, PayU) based on success rate, latency, and cost. Ranks them in $O(\log n)$ time to dynamically select the optimal provider for each transaction.

### C. The Circuit Breaker 
*   **Technology:** TypeScript Class Wrapper.
*   **Function:** Monitors outbound HTTP requests to external gateways. If a gateway times out repeatedly, the breaker "trips" (Opens), instantly removing the gateway from the routing pool to prevent thread exhaustion.

### D. The Data Persistence Layer
*   **Technology:** Pure SQL (MySQL), `mysql2` connection pool.
*   **Function:** Bypasses ORMs entirely for maximum performance. Uses **row-level pessimistic locking** (`SELECT ... FOR UPDATE`) to guarantee that concurrent database writes (e.g., simultaneous webhooks and user retries) do not cause race conditions.

## 3. Data Flow: Payment Initialization
1. Client POSTs to `/api/v1/payments` with an `Idempotency-Key`.
2. Middleware validates uniqueness via SHA-256 cache.
3. System inserts a `CREATED` transaction into MySQL.
4. Router Service pulls gateway metrics, filters out unhealthy gateways, and pushes the rest into a Max-Heap.
5. Router extracts the root node (best gateway) and routes the request.
6. System safely transitions state to `ROUTED`.

## 4. Deployment Strategy (Target Environment)
*   **Infrastructure:** AWS EC2 Instance (Linux).
*   **Containerization:** Docker & Docker Compose for isolated MySQL and Node.js environments.
*   **CI/CD:** GitHub Actions executes type-checking and automated failover simulation tests before building the production Docker images.