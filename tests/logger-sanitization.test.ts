/**
 * PHI Sanitization Tests
 *
 * Verifies that the logger never outputs Protected Health Information (PHI).
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger } from '../src/utils/logger.js';
import { resetConfig } from '../src/config.js';

let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

beforeEach(() => {
  resetConfig();
  // Set log level to debug so all messages are output
  process.env.LOG_LEVEL = 'debug';
  consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
  delete process.env.LOG_LEVEL;
});

describe('PHI Sanitization', () => {
  test('should redact patient IDs in string messages', () => {
    logger.info('Processing patient PT-10001');

    expect(consoleErrorSpy).toHaveBeenCalled();
    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('PT-10001');
    expect(output).toContain('PT-[REDACTED]');
  });

  test('should redact patient name fields in data objects', () => {
    logger.info('Patient found', {
      firstName: 'Jane',
      lastName: 'Marple',
      id: 'PT-10001',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('Jane');
    expect(output).not.toContain('Marple');
    expect(output).toContain('[REDACTED]');
  });

  test('should redact phone numbers', () => {
    logger.info('Contact info', {
      phone: '555-0101',
      phoneNumber: '615-555-1234',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('555-0101');
    expect(output).not.toContain('615-555-1234');
  });

  test('should redact email addresses', () => {
    logger.info('Contact info', {
      email: 'patient@example.com',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('patient@example.com');
  });

  test('should redact address fields', () => {
    logger.info('Location', {
      address: '123 Oak Street, Nashville, TN',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('123 Oak Street');
  });

  test('should redact date of birth', () => {
    logger.info('Demographics', {
      dateOfBirth: '1942-03-15',
      dob: '1942-03-15',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('1942-03-15');
  });

  test('should redact diagnosis information', () => {
    logger.info('Clinical data', {
      diagnosis: 'Type 2 Diabetes',
      condition: 'CHF exacerbation',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('Type 2 Diabetes');
    expect(output).not.toContain('CHF exacerbation');
  });

  test('should redact medication information', () => {
    logger.info('Medications', {
      medication: 'Metformin 500mg BID',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('Metformin');
  });

  test('should redact notes and clinical notes', () => {
    logger.info('Visit data', {
      notes: 'Patient reports worsening symptoms',
      note: 'SOAP note content here',
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('worsening symptoms');
    expect(output).not.toContain('SOAP note content');
  });

  test('should redact nested patient data objects', () => {
    logger.info('Search result', {
      patientData: {
        firstName: 'Jane',
        lastName: 'Marple',
      },
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('Jane');
    expect(output).not.toContain('Marple');
    expect(output).toContain('PATIENT_DATA_REDACTED');
  });

  test('should redact patient IDs in arrays', () => {
    logger.info('Batch operation', ['PT-10001', 'PT-10002']);

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).not.toContain('PT-10001');
    expect(output).not.toContain('PT-10002');
    expect(output).toContain('PT-[REDACTED]');
  });

  test('should preserve non-PHI fields', () => {
    logger.info('Operation details', {
      operation: 'search',
      resultCount: 3,
      duration: 45,
      success: true,
    });

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).toContain('search');
    expect(output).toContain('3');
    expect(output).toContain('45');
    expect(output).toContain('true');
  });

  test('should handle null and undefined data gracefully', () => {
    logger.info('Null test', null);
    logger.info('Undefined test', undefined);

    expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
  });

  test('audit log should not contain PHI', () => {
    logger.audit('create_visit_note', true, 150);

    const output = consoleErrorSpy.mock.calls[0][0] as string;
    expect(output).toContain('AUDIT');
    expect(output).toContain('create_visit_note');
    expect(output).toContain('SUCCESS');
    expect(output).toContain('150ms');
  });
});
