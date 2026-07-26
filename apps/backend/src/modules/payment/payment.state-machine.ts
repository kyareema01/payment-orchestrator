export type PaymentState = 'CREATED' | 'ROUTED' | 'AUTHORISED' | 'CAPTURED' | 'FAILED' | 'REFUNDED'

// Adjacency Map defining valid edges (transitions) in the State Graph
const stateTransitions: Record<PaymentState, Set<PaymentState>> = {
  CREATED: new Set(['ROUTED', 'FAILED']),
  ROUTED: new Set(['AUTHORISED', 'FAILED']),
  AUTHORISED: new Set(['CAPTURED', 'FAILED']),
  CAPTURED: new Set(['REFUNDED']), // Captured is a terminal success state unless refunded
  FAILED:  new Set([]),     // Failed is a terminal state
  REFUNDED: new Set([]),  
};

export class PaymentStateMachine {
  /**
   * Validates if the transition from current to target state is allowed.
   */
  static canTransition(currentState: PaymentState, targetState: PaymentState): boolean {
    const validNextState = stateTransitions[currentState];
    if (!validNextState) return false

    return validNextState.has(targetState)
  }
}