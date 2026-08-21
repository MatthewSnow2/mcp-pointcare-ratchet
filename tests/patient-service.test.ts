/**
 * Patient Service Unit Tests
 */

import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  searchPatients,
  getPatient,
  getPatientHistory,
  createVisitNote,
} from '../src/services/patient-service.js';
import { resetConfig } from '../src/config.js';
import { ValidationError, NotFoundError } from '../src/utils/errors.js';

// Reset config before each test to ensure mock mode
beforeEach(() => {
  resetConfig();
});

describe('searchPatients', () => {
  test('should find patient by name', async () => {
    const result = await searchPatients({ query: 'Eleanor' });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].firstName).toBe('Eleanor');
  });

  test('should return only the matching patient for a full name query', async () => {
    const result = await searchPatients({ query: 'Eleanor Thompson' });

    expect(result.results.length).toBe(1);
    expect(result.total).toBe(1);
    expect(result.results[0].id).toBe('PT-10001');
  });

  test('should return empty results for an all-letter name with no match', async () => {
    const result = await searchPatients({ query: 'Zebediah Quartermaine' });

    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  test('should return empty results for an all-letter phone search', async () => {
    const result = await searchPatients({ query: 'Eleanor', searchType: 'phone' });

    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });

  test('should find patient by ID', async () => {
    const result = await searchPatients({ query: 'PT-10001', searchType: 'id' });

    expect(result.results.length).toBe(1);
    expect(result.results[0].id).toBe('PT-10001');
  });

  test('should find patient by phone', async () => {
    const result = await searchPatients({ query: '5550101', searchType: 'phone' });

    expect(result.results.length).toBeGreaterThan(0);
    expect(result.results[0].phone).toContain('555-0101');
  });

  test('should filter by status', async () => {
    const result = await searchPatients({ query: 'Thompson', status: 'active' });

    result.results.forEach((patient) => {
      expect(patient.status).toBe('active');
    });
  });

  test('should respect limit parameter', async () => {
    // Search for a common term that matches multiple patients
    const result = await searchPatients({ query: 'PT-', limit: 2 });

    expect(result.limit).toBe(2);
    expect(result.results.length).toBeLessThanOrEqual(2);
  });

  test('should throw ValidationError for empty query', async () => {
    await expect(searchPatients({ query: '' })).rejects.toThrow(ValidationError);
  });

  test('should return empty results for no match', async () => {
    const result = await searchPatients({ query: 'NonexistentPatient12345' });

    expect(result.results.length).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('getPatient', () => {
  test('should return patient by ID', async () => {
    const patient = await getPatient('PT-10001');

    expect(patient.id.id).toBe('PT-10001');
    expect(patient.demographics.firstName).toBe('Eleanor');
    expect(patient.demographics.lastName).toBe('Thompson');
  });

  test('should throw NotFoundError for invalid ID', async () => {
    await expect(getPatient('PT-99999')).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError for empty ID', async () => {
    await expect(getPatient('')).rejects.toThrow(ValidationError);
  });
});

describe('getPatientHistory', () => {
  test('should return visit history for patient', async () => {
    const result = await getPatientHistory({ patientId: 'PT-10001' });

    expect(result.patientId).toBe('PT-10001');
    expect(result.patientName).toBe('Eleanor Thompson');
    expect(result.visits.length).toBeGreaterThan(0);
  });

  test('should respect limit parameter', async () => {
    const result = await getPatientHistory({ patientId: 'PT-10001', limit: 1 });

    expect(result.visits.length).toBeLessThanOrEqual(1);
  });

  test('should throw NotFoundError for invalid patient', async () => {
    await expect(getPatientHistory({ patientId: 'PT-99999' })).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError for empty patient ID', async () => {
    await expect(getPatientHistory({ patientId: '' })).rejects.toThrow(ValidationError);
  });

  test('should return visits in descending date order', async () => {
    const result = await getPatientHistory({ patientId: 'PT-10001' });

    for (let i = 1; i < result.visits.length; i++) {
      expect(result.visits[i - 1].visitDate >= result.visits[i].visitDate).toBe(true);
    }
  });
});

describe('createVisitNote', () => {
  test('should create visit note with required fields', async () => {
    const result = await createVisitNote({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      visitDate: '2024-12-22',
      timeIn: '10:00',
      timeOut: '10:45',
    });

    expect(result.success).toBe(true);
    expect(result.visitNoteId).toBeDefined();
    expect(result.visitNote?.patientId).toBe('PT-10001');
    expect(result.visitNote?.duration).toBe(45);
  });

  test('should create visit note with vital signs', async () => {
    const result = await createVisitNote({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      visitDate: '2024-12-22',
      timeIn: '14:00',
      timeOut: '14:30',
      vitalSigns: {
        bloodPressureSystolic: 120,
        bloodPressureDiastolic: 80,
        heartRate: 72,
      },
    });

    expect(result.success).toBe(true);
    expect(result.visitNote?.vitalSigns?.bloodPressureSystolic).toBe(120);
    expect(result.visitNote?.vitalSigns?.bloodPressureDiastolic).toBe(80);
  });

  test('should throw NotFoundError for invalid patient', async () => {
    await expect(
      createVisitNote({
        patientId: 'PT-99999',
        visitType: 'skilled_nursing',
        visitDate: '2024-12-22',
        timeIn: '10:00',
        timeOut: '10:45',
      })
    ).rejects.toThrow(NotFoundError);
  });

  test('should throw ValidationError for missing required fields', async () => {
    await expect(
      createVisitNote({
        patientId: 'PT-10001',
        visitType: 'skilled_nursing',
        visitDate: '',
        timeIn: '10:00',
        timeOut: '10:45',
      })
    ).rejects.toThrow(ValidationError);
  });

  test('should calculate duration correctly', async () => {
    const result = await createVisitNote({
      patientId: 'PT-10001',
      visitType: 'skilled_nursing',
      visitDate: '2024-12-22',
      timeIn: '09:15',
      timeOut: '10:00',
    });

    expect(result.visitNote?.duration).toBe(45);
  });
});
