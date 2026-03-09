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
  toSearchResult,
  toVisitSummary,
  generateVisitNoteId,
  getCurrentTimestamp,
} from './mock-data.js';
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
