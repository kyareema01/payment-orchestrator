# ZethetaIntern Payment Orchestrator (Feature Branch)

A high-throughput, fault-tolerant payment orchestration API built with Node.js, Express, Next.js, and pure SQL. 

This system intelligently routes transactions across multiple third-party payment gateways (Stripe, Razorpay, PayU) using low-level Data Structures and Algorithms (DSA) to optimize for success rate, latency, and cost.

## 🚀 Core Engineering Features

*   **Algorithmic Routing:** Implements a custom Max-Heap (Priority Queue) from scratch to rank and select gateways in `O(log n)` time.
*   **Circuit Breaker Pattern:** Automatically detects third-party gateway failures and cuts off traffic to prevent cascading server crashes.
*   **Idempotency Framework:** Utilizes SHA-256 hashing and in-memory caching to guarantee exactly-once processing and prevent duplicate user charges.
*   **Strict State Machine:** Enforces valid transaction lifecycles using a directed graph map.
*   **Pure SQL Persistence:** Bypasses ORMs in favor of raw MySQL queries. Implements row-level pessimistic locking (`SELECT ... FOR UPDATE`) to handle concurrent webhook ingestion safely.
*   **Real-time Analytics:** Next.js Server-Side Rendered (SSR) dashboard for gateway health visualization.

## 🛠 Prerequisites

*   Node.js (v18+)
*   Docker & Docker Compose (for the MySQL database)
*   Git

## 💻 Local Setup & Execution

1. **Clone the repository**
   ```bash
   git clone (https://github.com/kyareema01/payment-orchestrator.git)
   cd payment-orchestrator