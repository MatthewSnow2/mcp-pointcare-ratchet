/**
 * Visit State Machine
 *
 * Enforces valid visit status transitions:
 *   scheduled → in_progress → completed
 *   scheduled → cancelled
 *   in_progress → cancelled
 */

import type { VisitStatus } from '../types/index.js';
import { ValidationError } from '../utils/errors.js';

const VALID_TRANSITIONS: Record<VisitStatus, VisitStatus[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
  missed: [],
  pending_review: ['completed'],
};

/**
 * Check if a transition is valid
 */
export function canTransition(from: VisitStatus, to: VisitStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate and return the new status, or throw
 */
export function validateTransition(from: VisitStatus, to: VisitStatus): void {
  if (!canTransition(from, to)) {
    throw new ValidationError(
      `Cannot transition visit from "${from}" to "${to}". Valid transitions from "${from}": ${VALID_TRANSITIONS[from]?.join(', ') || 'none'}`,
      'status'
    );
  }
}
