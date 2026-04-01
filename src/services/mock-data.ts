/**
 * Mock data for testing ChartingHero MCP server
 *
 * This module provides realistic test data for development and testing
 * without requiring access to the PointCare API.
 *
 * NOTE: All names, addresses, and identifiers are fictional.
 */

import type {
  Patient,
  PatientSearchResult,
  VisitNote,
  VisitNoteSummary,
  VisitType,
  ScheduledVisit,
  CarePlan,
} from '../types/index.js';

/**
 * Mock patient database
 */
export const mockPatients: Patient[] = [
  {
    id: { id: 'PT-10001', mrn: 'MRN-001' },
    demographics: {
      firstName: 'Jane',
      lastName: 'Marple',
      dateOfBirth: '1942-03-15',
      gender: 'female',
    },
    contact: {
      phone: '555-0101',
      phoneType: 'home',
      address: {
        street1: '123 Oak Street',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37201',
      },
    },
    insurance: {
      primaryPayer: 'Medicare',
      memberId: 'MBI-001-TEST',
    },
    careTeam: {
      primaryNurse: 'Sarah Johnson, RN',
      primaryPhysician: 'Dr. Michael Chen',
      agency: 'Nashville Home Health',
    },
    status: 'active',
    admissionDate: '2024-11-01',
    diagnosis: ['Type 2 Diabetes', 'Hypertension', 'CHF'],
    createdAt: '2024-11-01T10:00:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
  },
  {
    id: { id: 'PT-10002', mrn: 'MRN-002' },
    demographics: {
      firstName: 'Hercule',
      lastName: 'Poirot',
      dateOfBirth: '1955-07-22',
      gender: 'male',
    },
    contact: {
      phone: '555-0102',
      phoneType: 'mobile',
      address: {
        street1: '456 Maple Avenue',
        street2: 'Apt 2B',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37203',
      },
    },
    insurance: {
      primaryPayer: 'Blue Cross',
      memberId: 'BC-002-TEST',
    },
    careTeam: {
      primaryNurse: 'Sarah Johnson, RN',
      primaryPhysician: 'Dr. Lisa Wong',
      agency: 'Nashville Home Health',
    },
    status: 'active',
    admissionDate: '2024-10-15',
    diagnosis: ['Heart Failure', 'Atrial Fibrillation', 'Chronic Kidney Disease Stage 3'],
    createdAt: '2024-10-15T09:00:00Z',
    updatedAt: '2024-12-19T11:00:00Z',
  },
  {
    id: { id: 'PT-10003', mrn: 'MRN-003' },
    demographics: {
      firstName: 'Ariadne',
      lastName: 'Oliver',
      dateOfBirth: '1938-11-08',
      gender: 'female',
    },
    contact: {
      phone: '555-0103',
      phoneType: 'home',
      alternatePhone: '555-0104',
      address: {
        street1: '789 Pine Road',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37205',
      },
    },
    insurance: {
      primaryPayer: 'Medicare',
      memberId: 'MBI-003-TEST',
    },
    careTeam: {
      primaryNurse: 'James Miller, RN',
      primaryPhysician: 'Dr. Michael Chen',
      agency: 'Nashville Home Health',
    },
    status: 'active',
    admissionDate: '2024-09-01',
    diagnosis: ['Parkinson\'s Disease', 'Fall risk', 'Osteoporosis'],
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-12-18T16:00:00Z',
  },
  {
    id: { id: 'PT-10004', mrn: 'MRN-004' },
    demographics: {
      firstName: 'Arthur',
      lastName: 'Hastings',
      dateOfBirth: '1960-04-30',
      gender: 'male',
    },
    contact: {
      phone: '555-0105',
      phoneType: 'mobile',
      address: {
        street1: '321 Elm Street',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37204',
      },
    },
    insurance: {
      primaryPayer: 'Aetna',
      memberId: 'AET-004-TEST',
    },
    careTeam: {
      primaryNurse: 'Sarah Johnson, RN',
      primaryPhysician: 'Dr. Lisa Wong',
      agency: 'Nashville Home Health',
    },
    status: 'active',
    admissionDate: '2024-12-01',
    diagnosis: ['Post-stroke rehabilitation', 'Hypertension'],
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-15T09:00:00Z',
  },
  {
    id: { id: 'PT-10005', mrn: 'MRN-005' },
    demographics: {
      firstName: 'Felicity',
      lastName: 'Lemon',
      dateOfBirth: '1945-09-12',
      gender: 'female',
    },
    contact: {
      phone: '555-0106',
      phoneType: 'home',
      address: {
        street1: '654 Birch Lane',
        city: 'Nashville',
        state: 'TN',
        zipCode: '37206',
      },
    },
    insurance: {
      primaryPayer: 'Medicare',
      memberId: 'MBI-005-TEST',
    },
    careTeam: {
      primaryNurse: 'James Miller, RN',
      primaryPhysician: 'Dr. Michael Chen',
      agency: 'Nashville Home Health',
    },
    status: 'discharged',
    admissionDate: '2024-08-01',
    dischargeDate: '2024-11-30',
    diagnosis: ['Hip replacement recovery'],
    createdAt: '2024-08-01T11:00:00Z',
    updatedAt: '2024-11-30T15:00:00Z',
  },
];

/**
 * Mock visit notes database
 */
export const mockVisitNotes: VisitNote[] = [
  // Jane Marple's visits
  {
    id: 'VN-20001',
    patientId: 'PT-10001',
    visitType: 'skilled_nursing',
    status: 'completed',
    visitDate: '2024-12-20',
    timeIn: '09:00',
    timeOut: '09:45',
    duration: 45,
    vitalSigns: {
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 82,
      heartRate: 72,
      temperature: 98.4,
      temperatureUnit: 'F',
      oxygenSaturation: 96,
      weight: 165,
      weightUnit: 'lbs',
    },
    subjective: 'Patient reports feeling well. Denies chest pain, shortness of breath. States blood sugars have been stable.',
    objective: 'Alert and oriented x3. Lungs clear bilaterally. No peripheral edema noted. Skin intact.',
    assessment: 'CHF stable. Diabetes well controlled. BP slightly elevated.',
    plan: 'Continue current medication regimen. Monitor BP. Follow up in 3 days.',
    interventions: ['Vital signs assessment', 'Medication reconciliation', 'Disease education'],
    patientResponse: 'Patient receptive to teaching. Verbalized understanding.',
    education: ['Importance of daily weights', 'Low sodium diet review'],
    nextVisitDate: '2024-12-23',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    signedAt: '2024-12-20T10:00:00Z',
    signedBy: 'Sarah Johnson, RN',
    createdAt: '2024-12-20T09:45:00Z',
    updatedAt: '2024-12-20T10:00:00Z',
  },
  {
    id: 'VN-20002',
    patientId: 'PT-10001',
    visitType: 'skilled_nursing',
    status: 'completed',
    visitDate: '2024-12-17',
    timeIn: '10:00',
    timeOut: '10:50',
    duration: 50,
    vitalSigns: {
      bloodPressureSystolic: 142,
      bloodPressureDiastolic: 88,
      heartRate: 78,
      temperature: 98.2,
      temperatureUnit: 'F',
      oxygenSaturation: 95,
      weight: 167,
      weightUnit: 'lbs',
    },
    subjective: 'Patient reports mild ankle swelling. No chest pain or SOB.',
    objective: 'Alert and oriented. 1+ pitting edema bilateral ankles. Lungs with fine crackles at bases.',
    assessment: 'Early signs of CHF exacerbation. Weight up 2 lbs from last visit.',
    plan: 'Contact physician regarding findings. Patient to elevate legs. Strict I&O.',
    interventions: ['Vital signs assessment', 'Physical assessment', 'Physician notification'],
    patientResponse: 'Patient concerned about weight gain. Willing to comply with recommendations.',
    education: ['Signs of CHF worsening', 'When to call nurse/doctor'],
    nextVisitDate: '2024-12-20',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    signedAt: '2024-12-17T11:00:00Z',
    signedBy: 'Sarah Johnson, RN',
    createdAt: '2024-12-17T10:50:00Z',
    updatedAt: '2024-12-17T11:00:00Z',
  },
  // Hercule Poirot's visits
  {
    id: 'VN-20003',
    patientId: 'PT-10002',
    visitType: 'skilled_nursing',
    status: 'completed',
    visitDate: '2024-12-19',
    timeIn: '14:00',
    timeOut: '14:40',
    duration: 40,
    vitalSigns: {
      bloodPressureSystolic: 128,
      bloodPressureDiastolic: 76,
      heartRate: 68,
      temperature: 98.6,
      temperatureUnit: 'F',
      oxygenSaturation: 93,
    },
    subjective: 'Patient reports mild ankle swelling this morning. Denies chest pain or shortness of breath at rest. States he has been monitoring weight daily.',
    objective: 'Alert and oriented. 1+ pitting edema bilateral ankles. Lungs clear bilaterally. Weight 185 lbs, up 1.5 lbs from last visit. Heart irregular rhythm consistent with known AFib.',
    assessment: 'Heart failure stable with mild fluid retention. AFib rate-controlled. Weight trending up — monitor closely.',
    plan: 'Continue current medications. Reinforce sodium restriction. Patient to elevate legs when seated. Follow up in 2 days to recheck weight.',
    interventions: ['Heart failure assessment', 'Weight monitoring', 'Edema assessment', 'Medication reconciliation'],
    patientResponse: 'Patient engaged and asking appropriate questions about sodium intake.',
    education: ['Daily weight monitoring technique', 'Low sodium diet review', 'Signs of heart failure worsening'],
    nextVisitDate: '2024-12-21',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    signedAt: '2024-12-19T15:00:00Z',
    signedBy: 'Sarah Johnson, RN',
    createdAt: '2024-12-19T14:40:00Z',
    updatedAt: '2024-12-19T15:00:00Z',
  },
  // Ariadne Oliver's visits
  {
    id: 'VN-20004',
    patientId: 'PT-10003',
    visitType: 'skilled_nursing',
    status: 'completed',
    visitDate: '2024-12-18',
    timeIn: '11:00',
    timeOut: '12:00',
    duration: 60,
    vitalSigns: {
      bloodPressureSystolic: 118,
      bloodPressureDiastolic: 72,
      heartRate: 64,
      temperature: 97.8,
      temperatureUnit: 'F',
      oxygenSaturation: 98,
    },
    subjective: 'Patient reports occasional tremor but manageable. No falls since last visit.',
    objective: 'Mild resting tremor bilateral hands. Gait steady with walker. Home environment safe.',
    assessment: 'Parkinson\'s symptoms stable. Fall prevention measures in place.',
    plan: 'Continue current medications. Reinforce fall prevention strategies.',
    interventions: ['Neurological assessment', 'Fall risk assessment', 'Home safety evaluation'],
    patientResponse: 'Patient and caregiver engaged in care planning.',
    education: ['Fall prevention', 'Medication timing importance'],
    nextVisitDate: '2024-12-25',
    nurseId: 'RN-002',
    nurseName: 'James Miller, RN',
    signedAt: '2024-12-18T12:30:00Z',
    signedBy: 'James Miller, RN',
    createdAt: '2024-12-18T12:00:00Z',
    updatedAt: '2024-12-18T12:30:00Z',
  },
];

/**
 * Mock scheduled visits
 */
export const mockSchedule: ScheduledVisit[] = [
  {
    id: 'SV-40001',
    patientId: 'PT-10001',
    patientName: 'Jane Marple',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    visitType: 'skilled_nursing',
    status: 'scheduled',
    scheduledDate: '2024-12-23',
    scheduledTime: '09:00',
    estimatedDuration: 45,
    address: '123 Oak Street, Nashville, TN 37201',
  },
  {
    id: 'SV-40002',
    patientId: 'PT-10002',
    patientName: 'Hercule Poirot',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    visitType: 'skilled_nursing',
    status: 'scheduled',
    scheduledDate: '2024-12-23',
    scheduledTime: '11:00',
    estimatedDuration: 40,
    address: '456 Maple Avenue, Apt 2B, Nashville, TN 37203',
  },
  {
    id: 'SV-40003',
    patientId: 'PT-10003',
    patientName: 'Ariadne Oliver',
    nurseId: 'RN-002',
    nurseName: 'James Miller, RN',
    visitType: 'skilled_nursing',
    status: 'scheduled',
    scheduledDate: '2024-12-25',
    scheduledTime: '10:00',
    estimatedDuration: 60,
    address: '789 Pine Road, Nashville, TN 37205',
  },
  {
    id: 'SV-40004',
    patientId: 'PT-10004',
    patientName: 'Arthur Hastings',
    nurseId: 'RN-001',
    nurseName: 'Sarah Johnson, RN',
    visitType: 'physical_therapy',
    status: 'scheduled',
    scheduledDate: '2024-12-24',
    scheduledTime: '14:00',
    estimatedDuration: 60,
    address: '321 Elm Street, Nashville, TN 37204',
    notes: 'Post-stroke PT evaluation — assess upper extremity function',
  },
];

/**
 * Mock care plans
 */
export const mockCarePlans: CarePlan[] = [
  {
    patientId: 'PT-10001',
    goals: [
      {
        id: 'G-50001',
        description: 'Maintain blood pressure below 140/90 mmHg',
        targetDate: '2025-02-01',
        status: 'active',
        progress: 'BP trending down. Last reading 138/82.',
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
      },
      {
        id: 'G-50002',
        description: 'Patient will verbalize 3 signs of CHF worsening',
        targetDate: '2025-01-15',
        status: 'met',
        progress: 'Patient demonstrated understanding on 12/20 visit.',
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
      },
      {
        id: 'G-50003',
        description: 'Maintain HbA1c below 7.0%',
        targetDate: '2025-03-01',
        status: 'active',
        progress: 'Blood sugars reported as stable. Next lab draw 01/15.',
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z',
      },
    ],
    lastReviewDate: '2024-12-20',
    nextReviewDate: '2025-01-03',
  },
  {
    patientId: 'PT-10002',
    goals: [
      {
        id: 'G-50004',
        description: 'Weight gain no more than 2 lbs per week',
        targetDate: '2025-02-15',
        status: 'active',
        progress: 'Weight up 1.5 lbs this week — monitoring closely.',
        createdAt: '2024-10-15T09:00:00Z',
        updatedAt: '2024-12-19T15:00:00Z',
      },
      {
        id: 'G-50005',
        description: 'Patient will adhere to 2g sodium diet daily',
        targetDate: '2025-01-15',
        status: 'active',
        progress: 'Patient asking appropriate questions about sodium. Engaged.',
        createdAt: '2024-10-15T09:00:00Z',
        updatedAt: '2024-12-19T15:00:00Z',
      },
    ],
    lastReviewDate: '2024-12-19',
    nextReviewDate: '2025-01-02',
  },
  {
    patientId: 'PT-10003',
    goals: [
      {
        id: 'G-50006',
        description: 'Zero falls during certification period',
        targetDate: '2025-03-01',
        status: 'active',
        progress: 'No falls reported. Walker use consistent.',
        createdAt: '2024-09-01T08:00:00Z',
        updatedAt: '2024-12-18T12:30:00Z',
      },
      {
        id: 'G-50007',
        description: 'Maintain safe home environment per fall risk checklist',
        targetDate: '2025-03-01',
        status: 'active',
        progress: 'Home safety evaluation completed 12/18 — all clear.',
        createdAt: '2024-09-01T08:00:00Z',
        updatedAt: '2024-12-18T12:30:00Z',
      },
    ],
    lastReviewDate: '2024-12-18',
    nextReviewDate: '2025-01-01',
  },
];

/**
 * ID counters for new records
 */
let scheduleCounter = 40010;
export function generateScheduleId(): string {
  return `SV-${scheduleCounter++}`;
}

let goalCounter = 50010;
export function generateGoalId(): string {
  return `G-${goalCounter++}`;
}

/**
 * Convert Patient to PatientSearchResult
 */
export function toSearchResult(patient: Patient): PatientSearchResult {
  return {
    id: patient.id.id,
    firstName: patient.demographics.firstName,
    lastName: patient.demographics.lastName,
    dateOfBirth: patient.demographics.dateOfBirth,
    phone: patient.contact.phone,
    status: patient.status,
    primaryDiagnosis: patient.diagnosis?.[0],
  };
}

/**
 * Convert VisitNote to VisitNoteSummary
 */
export function toVisitSummary(visit: VisitNote): VisitNoteSummary {
  return {
    id: visit.id,
    visitDate: visit.visitDate,
    visitType: visit.visitType,
    status: visit.status,
    duration: visit.duration,
    nurseName: visit.nurseName,
    hasVitals: visit.vitalSigns !== undefined,
  };
}

/**
 * Generate a new visit note ID
 */
let visitNoteCounter = 30000;
export function generateVisitNoteId(): string {
  return `VN-${visitNoteCounter++}`;
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}
