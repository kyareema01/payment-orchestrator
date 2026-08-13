CREATE DATABASE IF NOT EXISTS payment_db;
USE payment_db;

-- Core State Machine Table
CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(36) PRIMARY KEY;
  amount DECIMAL(15, 2) NOT NULL
  currency VARCHAR(3) NOT NULL
  state VARCHAR(20) NOT NULL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)

-- Audit log for State Transitions (Crucial for debugging and Part 5 requirement)
CREATE TABLE transaction_events (
    id VARCHAR(36) PRIMARY KEY,
    transaction_id VARCHAR(36) NOT NULL,
    previous_state VARCHAR(20),
    new_state VARCHAR(20) NOT NULL,
    event_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
);