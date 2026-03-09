/**
 * Patient Service - Business logic for patient operations
 *
 * This service handles all patient-related operations. In mock mode,
 * it uses the mock data layer. When the PointCare API is available,
 * it will make real API calls.
 */

import { getConfig } from '../config.js';
import { logger } from '../utils/logger.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import {
  mockPatients,
  mockVisitNotes,
  mockSchedule,
  mockCarePlans,
  toSearchResult,
  toVisitSummary,
  generateVisitNoteId,
  generateScheduleId,
  generateGoalId,
  getCurrentTimestamp,
} from './mock-data.js';
import { validateTransition } from './visit-state.js';
import { syncVisitToSupabase, isSupabaseEnabled } from './supabase-service.js';
import type {
  Patient,
  PatientSearchParams,
  PatientSearchResponse,
  PatientHistoryParams,
  PatientHistoryResponse,
  CreateVisitNoteParams,
  CreateVisitNoteResponse,
  VisitNote,
  GetScheduleParams,
  ScheduleResponse,
  CareTeamResponse,
  CareTeamMember,
  ManageCarePlanParams,
  CarePlan,
  CarePlanGoal,
  ScheduleNextVisitParams,
  ScheduledVisit,
} from '../types/index.js';

/**
 * Search for patients
 */
export async function searchPatients(
  params: PatientSearchParams
): Promise<PatientSearchResponse> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Searching patients', { searchType: params.searchType, hasQuery: !!params.query });

  if (!params.query || params.query.trim().length === 0) {
    throw new ValidationError('Search query is required', 'query');
  }

  if (config.mockMode) {
    // Mock implementation
    const query = params.query.toLowerCase().trim();
    const searchType = params.searchType || 'all';
    const limit = params.limit || 10;
    const offset = params.offset || 0;

    let filtered = mockPatients.filter((patient) => {
      // Filter by status if specified
      if (params.status && patient.status !== params.status) {
        return false;
      }

      const fullName = `${patient.demographics.firstName} ${patient.demographics.lastName}`.toLowerCase();
      const id = patient.id.id.toLowerCase();
      const phone = (patient.contact.phone || '').replace(/\D/g, '');
      const queryDigits = query.replace(/\D/g, '');

      switch (searchType) {
        case 'name':
          return fullName.includes(query);
        case 'id':
          return id.includes(query);
        case 'phone':
          return phone.includes(queryDigits);
        case 'all':
        default:
          return (
            fullName.includes(query) ||
            id.includes(query) ||
            phone.includes(queryDigits)
          );
      }
    });

    const total = filtered.length;
    const results = filtered.slice(offset, offset + limit).map(toSearchResult);

    logger.audit('search_patient', true, Date.now() - startTime);

    return {
      results,
      total,
      limit,
      offset,
      hasMore: offset + results.length < total,
    };
  }

  // TODO: Real API implementation
  // const response = await fetch(`${config.apiUrl}/patients/search`, {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${config.apiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify(params),
  // });

  throw new Error('Real API not yet implemented');
}

/**
 * Get a patient by ID
 */
export async function getPatient(patientId: string): Promise<Patient> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Getting patient', { hasPatientId: !!patientId });

  if (!patientId || patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }

  if (config.mockMode) {
    const patient = mockPatients.find((p) => p.id.id === patientId);

    if (!patient) {
      logger.audit('get_patient', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    logger.audit('get_patient', true, Date.now() - startTime);
    return patient;
  }

  // TODO: Real API implementation
  throw new Error('Real API not yet implemented');
}

/**
 * Get patient visit history
 */
export async function getPatientHistory(
  params: PatientHistoryParams
): Promise<PatientHistoryResponse> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Getting patient history', { hasPatientId: !!params.patientId });

  if (!params.patientId || params.patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }

  if (config.mockMode) {
    // First verify the patient exists
    const patient = mockPatients.find((p) => p.id.id === params.patientId);
    if (!patient) {
      logger.audit('get_patient_history', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    const limit = params.limit || 10;
    const offset = params.offset || 0;

    // Filter visits for this patient
    let visits = mockVisitNotes.filter((v) => v.patientId === params.patientId);

    // Filter by date range if specified
    if (params.startDate) {
      visits = visits.filter((v) => v.visitDate >= params.startDate!);
    }
    if (params.endDate) {
      visits = visits.filter((v) => v.visitDate <= params.endDate!);
    }

    // Filter by visit type if specified
    if (params.visitType) {
      visits = visits.filter((v) => v.visitType === params.visitType);
    }

    // Sort by date descending (most recent first)
    visits.sort((a, b) => b.visitDate.localeCompare(a.visitDate));

    const total = visits.length;
    const paginatedVisits = visits.slice(offset, offset + limit);

    logger.audit('get_patient_history', true, Date.now() - startTime);

    return {
      patientId: params.patientId,
      patientName: `${patient.demographics.firstName} ${patient.demographics.lastName}`,
      visits: paginatedVisits.map(toVisitSummary),
      total,
      limit,
      offset,
      hasMore: offset + paginatedVisits.length < total,
    };
  }

  // TODO: Real API implementation
  throw new Error('Real API not yet implemented');
}

/**
 * Create a new visit note
 */
export async function createVisitNote(
  params: CreateVisitNoteParams
): Promise<CreateVisitNoteResponse> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Creating visit note', {
    hasPatientId: !!params.patientId,
    visitType: params.visitType,
  });

  // Validate required fields
  if (!params.patientId || params.patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }
  if (!params.visitType) {
    throw new ValidationError('Visit type is required', 'visitType');
  }
  if (!params.visitDate) {
    throw new ValidationError('Visit date is required', 'visitDate');
  }
  if (!params.timeIn) {
    throw new ValidationError('Time in is required', 'timeIn');
  }
  if (!params.timeOut) {
    throw new ValidationError('Time out is required', 'timeOut');
  }

  // Validate clinical ranges if vital signs provided
  if (params.vitalSigns) {
    const vs = params.vitalSigns;
    if (vs.bloodPressureSystolic !== undefined && (vs.bloodPressureSystolic < 50 || vs.bloodPressureSystolic > 300)) {
      throw new ValidationError('Systolic BP must be between 50-300 mmHg', 'vitalSigns.bloodPressureSystolic');
    }
    if (vs.bloodPressureDiastolic !== undefined && (vs.bloodPressureDiastolic < 20 || vs.bloodPressureDiastolic > 200)) {
      throw new ValidationError('Diastolic BP must be between 20-200 mmHg', 'vitalSigns.bloodPressureDiastolic');
    }
    if (vs.heartRate !== undefined && (vs.heartRate < 20 || vs.heartRate > 250)) {
      throw new ValidationError('Heart rate must be between 20-250 bpm', 'vitalSigns.heartRate');
    }
    if (vs.respiratoryRate !== undefined && (vs.respiratoryRate < 4 || vs.respiratoryRate > 60)) {
      throw new ValidationError('Respiratory rate must be between 4-60 breaths/min', 'vitalSigns.respiratoryRate');
    }
    if (vs.temperature !== undefined) {
      const unit = vs.temperatureUnit || 'F';
      if (unit === 'F' && (vs.temperature < 90 || vs.temperature > 110)) {
        throw new ValidationError('Temperature must be between 90-110°F', 'vitalSigns.temperature');
      }
      if (unit === 'C' && (vs.temperature < 32 || vs.temperature > 43)) {
        throw new ValidationError('Temperature must be between 32-43°C', 'vitalSigns.temperature');
      }
    }
    if (vs.oxygenSaturation !== undefined && (vs.oxygenSaturation < 50 || vs.oxygenSaturation > 100)) {
      throw new ValidationError('O2 saturation must be between 50-100%', 'vitalSigns.oxygenSaturation');
    }
    if (vs.painLevel !== undefined && (vs.painLevel < 0 || vs.painLevel > 10)) {
      throw new ValidationError('Pain level must be between 0-10', 'vitalSigns.painLevel');
    }
  }

  // Validate date format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.visitDate)) {
    throw new ValidationError('Visit date must be in YYYY-MM-DD format', 'visitDate');
  }

  // Validate time format (HH:MM)
  if (!/^\d{2}:\d{2}$/.test(params.timeIn)) {
    throw new ValidationError('Time in must be in HH:MM format', 'timeIn');
  }
  if (!/^\d{2}:\d{2}$/.test(params.timeOut)) {
    throw new ValidationError('Time out must be in HH:MM format', 'timeOut');
  }

  if (config.mockMode) {
    // Verify patient exists
    const patient = mockPatients.find((p) => p.id.id === params.patientId);
    if (!patient) {
      logger.audit('create_visit_note', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    // Calculate duration in minutes
    const [inHour, inMin] = params.timeIn.split(':').map(Number);
    const [outHour, outMin] = params.timeOut.split(':').map(Number);
    const duration = (outHour * 60 + outMin) - (inHour * 60 + inMin);

    // Create the visit note
    const visitNote: VisitNote = {
      id: generateVisitNoteId(),
      patientId: params.patientId,
      visitType: params.visitType,
      status: 'completed',
      visitDate: params.visitDate,
      timeIn: params.timeIn,
      timeOut: params.timeOut,
      duration: duration > 0 ? duration : 0,
      vitalSigns: params.vitalSigns,
      subjective: params.subjective,
      objective: params.objective,
      assessment: params.assessment,
      plan: params.plan,
      interventions: params.interventions,
      patientResponse: params.patientResponse,
      education: params.education,
      notes: params.notes,
      nextVisitDate: params.nextVisitDate,
      nurseId: 'RN-CURRENT', // Would come from auth context
      nurseName: 'Current User, RN', // Would come from auth context
      signedAt: getCurrentTimestamp(),
      signedBy: 'Current User, RN',
      createdAt: getCurrentTimestamp(),
      updatedAt: getCurrentTimestamp(),
    };

    // Add to mock database
    mockVisitNotes.push(visitNote);

    // Sync to Supabase for dashboard display
    if (isSupabaseEnabled()) {
      const synced = await syncVisitToSupabase(visitNote);
      if (synced) {
        logger.info('Visit synced to Supabase dashboard', { visitId: visitNote.id });
      } else {
        logger.warn('Failed to sync visit to Supabase', { visitId: visitNote.id });
      }
    }

    logger.audit('create_visit_note', true, Date.now() - startTime);

    return {
      success: true,
      visitNoteId: visitNote.id,
      message: `Visit note ${visitNote.id} created successfully for patient ${params.patientId}${isSupabaseEnabled() ? ' (synced to dashboard)' : ''}`,
      visitNote,
    };
  }

  // TODO: Real API implementation
  throw new Error('Real API not yet implemented');
}

/**
 * Get care team for a patient
 */
export async function getCareTeam(patientId: string): Promise<CareTeamResponse> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Getting care team', { hasPatientId: !!patientId });

  if (!patientId || patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }

  if (config.mockMode) {
    const patient = mockPatients.find((p) => p.id.id === patientId);
    if (!patient) {
      logger.audit('get_care_team', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    const members: CareTeamMember[] = [];
    if (patient.careTeam?.primaryNurse) {
      members.push({ role: 'Primary Nurse', name: patient.careTeam.primaryNurse });
    }
    if (patient.careTeam?.primaryPhysician) {
      members.push({ role: 'Primary Physician', name: patient.careTeam.primaryPhysician });
    }
    if (patient.careTeam?.caseManager) {
      members.push({ role: 'Case Manager', name: patient.careTeam.caseManager });
    }

    logger.audit('get_care_team', true, Date.now() - startTime);

    return {
      patientId,
      patientName: `${patient.demographics.firstName} ${patient.demographics.lastName}`,
      members,
      agency: patient.careTeam?.agency || 'Unknown',
    };
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Get schedule
 */
export async function getSchedule(params: GetScheduleParams): Promise<ScheduleResponse> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Getting schedule', {
    hasNurseId: !!params.nurseId,
    hasPatientId: !!params.patientId,
    hasDate: !!params.date,
  });

  if (!params.nurseId && !params.patientId && !params.date && !params.startDate) {
    throw new ValidationError('At least one filter is required: nurseId, patientId, date, or startDate', 'params');
  }

  if (config.mockMode) {
    let visits = [...mockSchedule];

    if (params.nurseId) {
      visits = visits.filter((v) => v.nurseId === params.nurseId);
    }
    if (params.patientId) {
      visits = visits.filter((v) => v.patientId === params.patientId);
    }
    if (params.date) {
      visits = visits.filter((v) => v.scheduledDate === params.date);
    }
    if (params.startDate) {
      visits = visits.filter((v) => v.scheduledDate >= params.startDate!);
    }
    if (params.endDate) {
      visits = visits.filter((v) => v.scheduledDate <= params.endDate!);
    }

    visits.sort((a, b) => {
      const dateCmp = a.scheduledDate.localeCompare(b.scheduledDate);
      return dateCmp !== 0 ? dateCmp : a.scheduledTime.localeCompare(b.scheduledTime);
    });

    logger.audit('get_schedule', true, Date.now() - startTime);

    return {
      visits,
      date: params.date,
      startDate: params.startDate,
      endDate: params.endDate,
      total: visits.length,
    };
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Start a visit — transition from scheduled to in_progress
 */
export async function startVisit(
  visitId: string
): Promise<{ visit: VisitNote; message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Starting visit', { hasVisitId: !!visitId });

  if (!visitId || visitId.trim().length === 0) {
    throw new ValidationError('Visit ID is required', 'visitId');
  }

  if (config.mockMode) {
    const scheduled = mockSchedule.find((v) => v.id === visitId);
    if (scheduled) {
      validateTransition(scheduled.status, 'in_progress');

      const visitNote: VisitNote = {
        id: generateVisitNoteId(),
        patientId: scheduled.patientId,
        visitType: scheduled.visitType,
        status: 'in_progress',
        visitDate: scheduled.scheduledDate,
        timeIn: new Date().toTimeString().slice(0, 5),
        timeOut: '',
        duration: 0,
        nurseId: scheduled.nurseId,
        nurseName: scheduled.nurseName,
        createdAt: getCurrentTimestamp(),
        updatedAt: getCurrentTimestamp(),
      };

      scheduled.status = 'in_progress';
      mockVisitNotes.push(visitNote);

      logger.audit('start_visit', true, Date.now() - startTime);

      return {
        visit: visitNote,
        message: `Visit started for ${scheduled.patientName}. Visit note ${visitNote.id} created.`,
      };
    }

    const existing = mockVisitNotes.find((v) => v.id === visitId);
    if (existing) {
      validateTransition(existing.status, 'in_progress');
      existing.status = 'in_progress';
      existing.updatedAt = getCurrentTimestamp();

      logger.audit('start_visit', true, Date.now() - startTime);

      return {
        visit: existing,
        message: `Visit ${visitId} started.`,
      };
    }

    logger.audit('start_visit', false, Date.now() - startTime);
    throw new NotFoundError('Visit');
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Update a visit note — merge fields into an in-progress visit
 */
export async function updateVisitNote(
  visitId: string,
  updates: Partial<CreateVisitNoteParams>
): Promise<{ visit: VisitNote; message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Updating visit note', { hasVisitId: !!visitId });

  if (!visitId || visitId.trim().length === 0) {
    throw new ValidationError('Visit ID is required', 'visitId');
  }

  if (config.mockMode) {
    const visit = mockVisitNotes.find((v) => v.id === visitId);
    if (!visit) {
      logger.audit('update_visit_note', false, Date.now() - startTime);
      throw new NotFoundError('Visit note');
    }

    if (visit.status !== 'in_progress') {
      throw new ValidationError(
        `Can only update in-progress visits. Current status: "${visit.status}"`,
        'status'
      );
    }

    if (updates.vitalSigns) {
      visit.vitalSigns = { ...visit.vitalSigns, ...updates.vitalSigns };
    }
    if (updates.subjective !== undefined) visit.subjective = updates.subjective;
    if (updates.objective !== undefined) visit.objective = updates.objective;
    if (updates.assessment !== undefined) visit.assessment = updates.assessment;
    if (updates.plan !== undefined) visit.plan = updates.plan;
    if (updates.interventions) {
      visit.interventions = [...(visit.interventions || []), ...updates.interventions];
    }
    if (updates.patientResponse !== undefined) visit.patientResponse = updates.patientResponse;
    if (updates.education) {
      visit.education = [...(visit.education || []), ...updates.education];
    }
    if (updates.notes !== undefined) visit.notes = updates.notes;
    if (updates.nextVisitDate !== undefined) visit.nextVisitDate = updates.nextVisitDate;
    visit.updatedAt = getCurrentTimestamp();

    if (isSupabaseEnabled()) {
      await syncVisitToSupabase(visit);
    }

    logger.audit('update_visit_note', true, Date.now() - startTime);

    return {
      visit,
      message: `Visit note ${visitId} updated.`,
    };
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Complete a visit — validate required fields and finalize
 */
export async function completeVisit(
  visitId: string
): Promise<{ visit: VisitNote; message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Completing visit', { hasVisitId: !!visitId });

  if (!visitId || visitId.trim().length === 0) {
    throw new ValidationError('Visit ID is required', 'visitId');
  }

  if (config.mockMode) {
    const visit = mockVisitNotes.find((v) => v.id === visitId);
    if (!visit) {
      logger.audit('complete_visit', false, Date.now() - startTime);
      throw new NotFoundError('Visit note');
    }

    validateTransition(visit.status, 'completed');

    const missing: string[] = [];
    if (!visit.subjective) missing.push('subjective');
    if (!visit.objective) missing.push('objective');
    if (!visit.assessment) missing.push('assessment');
    if (!visit.plan) missing.push('plan');

    if (missing.length > 0) {
      throw new ValidationError(
        `Cannot complete visit — missing required SOAP fields: ${missing.join(', ')}`,
        'soap'
      );
    }

    visit.status = 'completed';
    visit.timeOut = visit.timeOut || new Date().toTimeString().slice(0, 5);
    const [inH, inM] = visit.timeIn.split(':').map(Number);
    const [outH, outM] = visit.timeOut.split(':').map(Number);
    visit.duration = (outH * 60 + outM) - (inH * 60 + inM);
    visit.signedAt = getCurrentTimestamp();
    visit.signedBy = visit.nurseName;
    visit.updatedAt = getCurrentTimestamp();

    if (isSupabaseEnabled()) {
      await syncVisitToSupabase(visit);
    }

    logger.audit('complete_visit', true, Date.now() - startTime);

    return {
      visit,
      message: `Visit ${visitId} completed and signed by ${visit.nurseName}. Duration: ${visit.duration} min.`,
    };
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Cancel a visit with a reason
 */
export async function cancelVisit(
  visitId: string,
  reason: string
): Promise<{ message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Cancelling visit', { hasVisitId: !!visitId });

  if (!visitId || visitId.trim().length === 0) {
    throw new ValidationError('Visit ID is required', 'visitId');
  }
  if (!reason || reason.trim().length === 0) {
    throw new ValidationError('Cancellation reason is required', 'reason');
  }

  if (config.mockMode) {
    const scheduled = mockSchedule.find((v) => v.id === visitId);
    if (scheduled) {
      validateTransition(scheduled.status, 'cancelled');
      scheduled.status = 'cancelled';
      scheduled.notes = `Cancelled: ${reason}`;

      logger.audit('cancel_visit', true, Date.now() - startTime);
      return { message: `Scheduled visit ${visitId} cancelled. Reason: ${reason}` };
    }

    const visit = mockVisitNotes.find((v) => v.id === visitId);
    if (visit) {
      validateTransition(visit.status, 'cancelled');
      visit.status = 'cancelled';
      visit.notes = (visit.notes ? visit.notes + '\n' : '') + `Cancelled: ${reason}`;
      visit.updatedAt = getCurrentTimestamp();

      if (isSupabaseEnabled()) {
        await syncVisitToSupabase(visit);
      }

      logger.audit('cancel_visit', true, Date.now() - startTime);
      return { message: `Visit ${visitId} cancelled. Reason: ${reason}` };
    }

    logger.audit('cancel_visit', false, Date.now() - startTime);
    throw new NotFoundError('Visit');
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Schedule next visit
 */
export async function scheduleNextVisit(
  params: ScheduleNextVisitParams
): Promise<{ visit: ScheduledVisit; message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Scheduling next visit', { hasPatientId: !!params.patientId });

  if (!params.patientId || params.patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }
  if (!params.scheduledDate) {
    throw new ValidationError('Scheduled date is required', 'scheduledDate');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(params.scheduledDate)) {
    throw new ValidationError('Scheduled date must be in YYYY-MM-DD format', 'scheduledDate');
  }
  if (!params.scheduledTime) {
    throw new ValidationError('Scheduled time is required', 'scheduledTime');
  }
  if (!/^\d{2}:\d{2}$/.test(params.scheduledTime)) {
    throw new ValidationError('Scheduled time must be in HH:MM format', 'scheduledTime');
  }

  if (config.mockMode) {
    const patient = mockPatients.find((p) => p.id.id === params.patientId);
    if (!patient) {
      logger.audit('schedule_next_visit', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    const address = patient.contact.address;
    const addressStr = address
      ? `${address.street1}${address.street2 ? ', ' + address.street2 : ''}, ${address.city}, ${address.state} ${address.zipCode}`
      : 'Address on file';

    const visit: ScheduledVisit = {
      id: generateScheduleId(),
      patientId: params.patientId,
      patientName: `${patient.demographics.firstName} ${patient.demographics.lastName}`,
      nurseId: 'RN-CURRENT',
      nurseName: patient.careTeam?.primaryNurse || 'Unassigned',
      visitType: params.visitType,
      status: 'scheduled',
      scheduledDate: params.scheduledDate,
      scheduledTime: params.scheduledTime,
      estimatedDuration: params.estimatedDuration || 45,
      address: addressStr,
      notes: params.notes,
    };

    mockSchedule.push(visit);

    logger.audit('schedule_next_visit', true, Date.now() - startTime);

    return {
      visit,
      message: `Visit ${visit.id} scheduled for ${patient.demographics.firstName} ${patient.demographics.lastName} on ${params.scheduledDate} at ${params.scheduledTime}.`,
    };
  }

  throw new Error('Real API not yet implemented');
}

/**
 * Manage care plan — get, add goal, or update goal
 */
export async function manageCarePlan(
  params: ManageCarePlanParams
): Promise<{ carePlan?: CarePlan; goal?: CarePlanGoal; message: string }> {
  const config = getConfig();
  const startTime = Date.now();

  logger.info('Managing care plan', { action: params.action, hasPatientId: !!params.patientId });

  if (!params.patientId || params.patientId.trim().length === 0) {
    throw new ValidationError('Patient ID is required', 'patientId');
  }
  if (!params.action) {
    throw new ValidationError('Action is required (get, add_goal, update_goal)', 'action');
  }

  if (config.mockMode) {
    const patient = mockPatients.find((p) => p.id.id === params.patientId);
    if (!patient) {
      logger.audit('manage_care_plan', false, Date.now() - startTime);
      throw new NotFoundError('Patient');
    }

    let carePlan = mockCarePlans.find((cp) => cp.patientId === params.patientId);

    switch (params.action) {
      case 'get': {
        if (!carePlan) {
          logger.audit('manage_care_plan', true, Date.now() - startTime);
          return {
            message: `No care plan found for patient ${params.patientId}. Use action "add_goal" to create one.`,
          };
        }
        logger.audit('manage_care_plan', true, Date.now() - startTime);
        return {
          carePlan,
          message: `Care plan for ${patient.demographics.firstName} ${patient.demographics.lastName}: ${carePlan.goals.length} goals.`,
        };
      }

      case 'add_goal': {
        if (!params.goalDescription) {
          throw new ValidationError('Goal description is required for add_goal', 'goalDescription');
        }

        const newGoal: CarePlanGoal = {
          id: generateGoalId(),
          description: params.goalDescription,
          targetDate: params.targetDate,
          status: 'active',
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };

        if (!carePlan) {
          carePlan = {
            patientId: params.patientId,
            goals: [newGoal],
            lastReviewDate: new Date().toISOString().slice(0, 10),
          };
          mockCarePlans.push(carePlan);
        } else {
          carePlan.goals.push(newGoal);
          carePlan.lastReviewDate = new Date().toISOString().slice(0, 10);
        }

        logger.audit('manage_care_plan', true, Date.now() - startTime);
        return {
          goal: newGoal,
          carePlan,
          message: `Goal ${newGoal.id} added to care plan for ${patient.demographics.firstName} ${patient.demographics.lastName}.`,
        };
      }

      case 'update_goal': {
        if (!params.goalId) {
          throw new ValidationError('Goal ID is required for update_goal', 'goalId');
        }
        if (!carePlan) {
          throw new NotFoundError('Care plan');
        }

        const goal = carePlan.goals.find((g) => g.id === params.goalId);
        if (!goal) {
          throw new NotFoundError('Goal');
        }

        if (params.status) goal.status = params.status;
        if (params.progress) goal.progress = params.progress;
        goal.updatedAt = getCurrentTimestamp();
        carePlan.lastReviewDate = new Date().toISOString().slice(0, 10);

        logger.audit('manage_care_plan', true, Date.now() - startTime);
        return {
          goal,
          carePlan,
          message: `Goal ${params.goalId} updated${params.status ? ` — status: ${params.status}` : ''}.`,
        };
      }

      default:
        throw new ValidationError(`Unknown action: ${params.action}. Use get, add_goal, or update_goal.`, 'action');
    }
  }

  throw new Error('Real API not yet implemented');
}
