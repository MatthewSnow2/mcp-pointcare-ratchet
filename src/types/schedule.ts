/**
 * Schedule and care plan type definitions
 */

import type { VisitType, VisitStatus } from './visit.js';

/**
 * Scheduled visit entry
 */
export interface ScheduledVisit {
  id: string;
  patientId: string;
  patientName: string;
  nurseId: string;
  nurseName: string;
  visitType: VisitType;
  status: VisitStatus;
  scheduledDate: string;   // YYYY-MM-DD
  scheduledTime: string;   // HH:MM
  estimatedDuration: number; // minutes
  address: string;
  notes?: string;
}

/**
 * Schedule query parameters
 */
export interface GetScheduleParams {
  nurseId?: string;
  patientId?: string;
  date?: string;           // YYYY-MM-DD, defaults to today
  startDate?: string;      // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD
}

/**
 * Schedule response
 */
export interface ScheduleResponse {
  visits: ScheduledVisit[];
  date?: string;
  startDate?: string;
  endDate?: string;
  total: number;
}

/**
 * Care plan goal
 */
export interface CarePlanGoal {
  id: string;
  description: string;
  targetDate?: string;
  status: 'active' | 'met' | 'not_met' | 'revised' | 'discontinued';
  progress?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Care plan for a patient
 */
export interface CarePlan {
  patientId: string;
  goals: CarePlanGoal[];
  lastReviewDate: string;
  nextReviewDate?: string;
}

/**
 * manage_care_plan action parameter
 */
export type CarePlanAction = 'get' | 'add_goal' | 'update_goal';

/**
 * manage_care_plan request parameters
 */
export interface ManageCarePlanParams {
  patientId: string;
  action: CarePlanAction;
  // For add_goal
  goalDescription?: string;
  targetDate?: string;
  // For update_goal
  goalId?: string;
  status?: CarePlanGoal['status'];
  progress?: string;
}

/**
 * schedule_next_visit parameters
 */
export interface ScheduleNextVisitParams {
  patientId: string;
  visitType: VisitType;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration?: number;
  notes?: string;
}

/**
 * Care team member
 */
export interface CareTeamMember {
  role: string;
  name: string;
  phone?: string;
  email?: string;
}

/**
 * Care team response
 */
export interface CareTeamResponse {
  patientId: string;
  patientName: string;
  members: CareTeamMember[];
  agency: string;
}
