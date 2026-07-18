# Transaction State Machine Specification

## Overview
This document defines the strict lifecycle of a transaction within the orchestrator to prevent double-charging and race conditions.

## States
*   **CREATED:** The initial intent to pay has been registered in the database.
*   **ROUTED:** The Priority Queue has selected the optimal gateway, and the request is being sent.
*   **AUTHORISED:** The gateway has locked the funds on the customer's card, but they are not yet moved.
*   **CAPTURED:** The gateway webhook confirms funds have been successfully transferred.
*   **FAILED:** The gateway rejected the payment (insufficient funds, circuit breaker tripped, etc.).
*   **REFUNDED:** A previously CAPTURED transaction has been reversed.

## State Diagram (Mermaid)
```mermaid
stateDiagram-v2
    [*] --> CREATED
    CREATED --> ROUTED: Route via Max-Heap
    ROUTED --> AUTHORISED: Gateway Auth Success
    ROUTED --> FAILED: Gateway Auth Failure / Timeout
    AUTHORISED --> CAPTURED: Webhook Success Confirmation
    AUTHORISED --> FAILED: Webhook Failure Confirmation
    CAPTURED --> REFUNDED: Admin Refund Action
    FAILED --> [*]
    REFUNDED --> [*]