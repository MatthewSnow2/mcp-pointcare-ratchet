/**
 * Tests for Tier 2 tools: visit lifecycle, scheduling, care planning
 */

import {
  getCareTeam,
  getSchedule,
  startVisit,
  updateVisitNote,
  completeVisit,
  cancelVisit,
  scheduleNextVisit,
  manageCarePlan,
} from '../src/services/patient-service';
import { canTransition } from '../src/services/visit-state';
import { mockSchedule, mockVisitNotes, mockCarePlans } from '../src/services/mock-data';

// Force mock mode
process.env.RATCHET_MOCK_MODE = 'true';

// ── Visit State Machine ──────────────────────────────────────────────

describe('Visit State Machine', () => {
  test('allows scheduled → in_progress', () => {
    expect(canTransition('scheduled', 'in_progress')).toBe(true);
  });

  test('allows scheduled → cancelled', () => {
    expect(canTransition('scheduled', 'cancelled')).toBe(true);
  });

  test('allows in_progress → completed', () => {
    expect(canTransition('in_progress', 'completed')).toBe(true);
  });

  test('allows in_progress → cancelled', () => {
    expect(canTransition('in_progress', 'cancelled')).toBe(true);
  });

  test('blocks completed → anything', () => {
    expect(canTransition('completed', 'in_progress')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
    expect(canTransition('completed', 'scheduled')).toBe(false);
  });

  test('blocks cancelled → anything', () => {
    expect(canTransition('cancelled', 'in_progress')).toBe(false);
    expect(canTransition('cancelled', 'scheduled')).toBe(false);
  });

  test('blocks scheduled → completed (must go through in_progress)', () => {
    expect(canTransition('scheduled', 'completed')).toBe(false);
  });
});

// ── get_care_team ────────────────────────────────────────────────────

describe('getCareTeam', () => {
  test('returns care team for valid patient', async () => {
    const result = await getCareTeam('PT-10001');
    expect(result.patientId).toBe('PT-10001');
    expect(result.patientName).toBe('Jane Marple');
    expect(result.agency).toBe('Nashville Home Health');
    expect(result.members.length).toBeGreaterThanOrEqual(2);
    expect(result.members.find(m => m.role === 'Primary Nurse')).toBeDefined();
    expect(result.members.find(m => m.role === 'Primary Physician')).toBeDefined();
  });

  test('throws NotFoundError for invalid patient', async () => {
    await expect(getCareTeam('PT-99999')).rejects.toThrow('Patient not found');
  });

  test('throws ValidationError for empty ID', async () => {
    await expect(getCareTeam('')).rejects.toThrow('Patient ID is required');
  });
});

// ── get_schedule ─────────────────────────────────────────────────────

describe('getSchedule', () => {
  test('filters by nurseId', async () => {
    const result = await getSchedule({ nurseId: 'RN-001' });
    expect(result.total).toBeGreaterThan(0);
    for (const visit of result.visits) {
      expect(visit.nurseId).toBe('RN-001');
    }
  });

  test('filters by patientId', async () => {
    const result = await getSchedule({ patientId: 'PT-10001' });
    expect(result.total).toBeGreaterThan(0);
    for (const visit of result.visits) {
      expect(visit.patientId).toBe('PT-10001');
    }
  });

  test('filters by date', async () => {
    const result = await getSchedule({ date: '2024-12-23' });
    expect(result.total).toBeGreaterThan(0);
    for (const visit of result.visits) {
      expect(visit.scheduledDate).toBe('2024-12-23');
    }
  });

  test('returns empty for no-match date', async () => {
    const result = await getSchedule({ date: '2020-01-01' });
    expect(result.total).toBe(0);
  });

  test('throws when no filter provided', async () => {
    await expect(getSchedule({})).rejects.toThrow('At least one filter is required');
  });
});

// ── start_visit ──────────────────────────────────────────────────────

describe('startVisit', () => {
  test('starts a scheduled visit and creates visit note', async () => {
    // Find a scheduled visit
    const sv = mockSchedule.find(v => v.status === 'scheduled');
    expect(sv).toBeDefined();

    const result = await startVisit(sv!.id);
    expect(result.visit.status).toBe('in_progress');
    expect(result.visit.patientId).toBe(sv!.patientId);
    expect(result.message).toContain('Visit started');

    // Verify the schedule entry was updated
    expect(sv!.status).toBe('in_progress');
  });

  test('throws for non-existent visit', async () => {
    await expect(startVisit('SV-99999')).rejects.toThrow('Visit not found');
  });

  test('throws for empty visitId', async () => {
    await expect(startVisit('')).rejects.toThrow('Visit ID is required');
  });

  test('cannot start an already completed visit', async () => {
    const completed = mockVisitNotes.find(v => v.status === 'completed');
    expect(completed).toBeDefined();
    await expect(startVisit(completed!.id)).rejects.toThrow('Cannot transition');
  });
});

// ── update_visit_note ────────────────────────────────────────────────

describe('updateVisitNote', () => {
  let inProgressId: string;

  beforeAll(async () => {
    // Get the visit note we created from the startVisit test
    const ip = mockVisitNotes.find(v => v.status === 'in_progress');
    expect(ip).toBeDefined();
    inProgressId = ip!.id;
  });

  test('adds vitals to in-progress visit', async () => {
    const result = await updateVisitNote(inProgressId, {
      vitalSigns: { bloodPressureSystolic: 130, bloodPressureDiastolic: 80, heartRate: 72 },
    });
    expect(result.visit.vitalSigns?.bloodPressureSystolic).toBe(130);
    expect(result.visit.vitalSigns?.heartRate).toBe(72);
  });

  test('adds SOAP fields', async () => {
    const result = await updateVisitNote(inProgressId, {
      subjective: 'Patient reports feeling well.',
      objective: 'Alert and oriented x3.',
      assessment: 'Stable condition.',
      plan: 'Continue current treatment.',
    });
    expect(result.visit.subjective).toBe('Patient reports feeling well.');
    expect(result.visit.plan).toBe('Continue current treatment.');
  });

  test('appends interventions', async () => {
    await updateVisitNote(inProgressId, {
      interventions: ['Vital signs assessment'],
    });
    const result = await updateVisitNote(inProgressId, {
      interventions: ['Medication reconciliation'],
    });
    expect(result.visit.interventions).toContain('Vital signs assessment');
    expect(result.visit.interventions).toContain('Medication reconciliation');
  });

  test('rejects update on completed visit', async () => {
    const completed = mockVisitNotes.find(v => v.status === 'completed');
    await expect(updateVisitNote(completed!.id, { subjective: 'test' })).rejects.toThrow('Can only update in-progress');
  });

  test('throws for non-existent visit', async () => {
    await expect(updateVisitNote('VN-99999', {})).rejects.toThrow('Visit note not found');
  });
});

// ── complete_visit ───────────────────────────────────────────────────

describe('completeVisit', () => {
  test('completes a visit with all SOAP fields', async () => {
    const ip = mockVisitNotes.find(v => v.status === 'in_progress' && v.subjective && v.objective && v.assessment && v.plan);
    expect(ip).toBeDefined();

    const result = await completeVisit(ip!.id);
    expect(result.visit.status).toBe('completed');
    expect(result.visit.signedAt).toBeDefined();
    expect(result.visit.signedBy).toBeDefined();
    expect(result.message).toContain('completed and signed');
  });

  test('rejects completion without SOAP fields', async () => {
    // Create a new in-progress visit with no SOAP
    const sv = mockSchedule.find(v => v.status === 'scheduled');
    if (!sv) {
      // All scheduled visits used up — skip this test
      return;
    }
    const started = await startVisit(sv.id);
    await expect(completeVisit(started.visit.id)).rejects.toThrow('missing required SOAP fields');
  });

  test('throws for non-existent visit', async () => {
    await expect(completeVisit('VN-99999')).rejects.toThrow('Visit note not found');
  });
});

// ── cancel_visit ─────────────────────────────────────────────────────

describe('cancelVisit', () => {
  test('cancels a scheduled visit', async () => {
    const sv = mockSchedule.find(v => v.status === 'scheduled');
    if (!sv) return; // May all be used by prior tests

    const result = await cancelVisit(sv.id, 'Patient hospitalized');
    expect(result.message).toContain('cancelled');
    expect(result.message).toContain('Patient hospitalized');
    expect(sv.status).toBe('cancelled');
  });

  test('requires a reason', async () => {
    await expect(cancelVisit('SV-40001', '')).rejects.toThrow('Cancellation reason is required');
  });

  test('cannot cancel a completed visit', async () => {
    const completed = mockVisitNotes.find(v => v.status === 'completed');
    expect(completed).toBeDefined();
    await expect(cancelVisit(completed!.id, 'test')).rejects.toThrow('Cannot transition');
  });
});

// ── schedule_next_visit ──────────────────────────────────────────────

describe('scheduleNextVisit', () => {
  test('creates a new scheduled visit', async () => {
    const result = await scheduleNextVisit({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      scheduledDate: '2025-01-05',
      scheduledTime: '09:00',
      estimatedDuration: 45,
    });
    expect(result.visit.patientId).toBe('PT-10001');
    expect(result.visit.patientName).toBe('Jane Marple');
    expect(result.visit.scheduledDate).toBe('2025-01-05');
    expect(result.visit.status).toBe('scheduled');
    expect(result.visit.address).toContain('Nashville');
  });

  test('validates date format', async () => {
    await expect(scheduleNextVisit({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      scheduledDate: 'next-monday',
      scheduledTime: '09:00',
    })).rejects.toThrow('YYYY-MM-DD');
  });

  test('validates time format', async () => {
    await expect(scheduleNextVisit({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      scheduledDate: '2025-01-05',
      scheduledTime: '9am',
    })).rejects.toThrow('HH:MM');
  });

  test('throws for non-existent patient', async () => {
    await expect(scheduleNextVisit({
      patientId: 'PT-99999',
      visitType: 'skilled_nursing',
      scheduledDate: '2025-01-05',
      scheduledTime: '09:00',
    })).rejects.toThrow('Patient not found');
  });
});

// ── manage_care_plan ─────────────────────────────────────────────────

describe('manageCarePlan', () => {
  test('gets care plan for patient with goals', async () => {
    const result = await manageCarePlan({ patientId: 'PT-10001', action: 'get' });
    expect(result.carePlan).toBeDefined();
    expect(result.carePlan!.goals.length).toBeGreaterThan(0);
  });

  test('returns message for patient without care plan', async () => {
    const result = await manageCarePlan({ patientId: 'PT-10004', action: 'get' });
    expect(result.carePlan).toBeUndefined();
    expect(result.message).toContain('No care plan found');
  });

  test('adds a new goal', async () => {
    const result = await manageCarePlan({
      patientId: 'PT-10001',
      action: 'add_goal',
      goalDescription: 'Maintain weight within 2 lbs of baseline',
      targetDate: '2025-06-01',
    });
    expect(result.goal).toBeDefined();
    expect(result.goal!.status).toBe('active');
    expect(result.goal!.description).toContain('weight');
  });

  test('creates care plan for patient without one', async () => {
    const result = await manageCarePlan({
      patientId: 'PT-10004',
      action: 'add_goal',
      goalDescription: 'Regain upper extremity function',
    });
    expect(result.carePlan).toBeDefined();
    expect(result.carePlan!.goals.length).toBe(1);
  });

  test('updates a goal status', async () => {
    const plan = mockCarePlans.find(cp => cp.patientId === 'PT-10001');
    const goalId = plan!.goals[0].id;

    const result = await manageCarePlan({
      patientId: 'PT-10001',
      action: 'update_goal',
      goalId,
      status: 'met',
      progress: 'BP consistently below 140/90 for 30 days.',
    });
    expect(result.goal!.status).toBe('met');
    expect(result.goal!.progress).toContain('BP consistently');
  });

  test('throws for update_goal without goalId', async () => {
    await expect(manageCarePlan({
      patientId: 'PT-10001',
      action: 'update_goal',
    })).rejects.toThrow('Goal ID is required');
  });

  test('throws for add_goal without description', async () => {
    await expect(manageCarePlan({
      patientId: 'PT-10001',
      action: 'add_goal',
    })).rejects.toThrow('Goal description is required');
  });

  test('throws for non-existent patient', async () => {
    await expect(manageCarePlan({
      patientId: 'PT-99999',
      action: 'get',
    })).rejects.toThrow('Patient not found');
  });
});
