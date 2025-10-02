import z from 'zod';
import { INSIGHTLY_OBJECTS } from './common';

// Base validation schemas
const podSchema = z
  .string()
  .min(1, 'Pod is required')
  .regex(
    /^[a-z0-9]+$/,
    'Pod must contain only lowercase letters and numbers (e.g., na1, eu1)'
  );

const objectTypeSchema = z
  .string()
  .refine((val) => INSIGHTLY_OBJECTS.includes(val), {
    message: 'Please select a valid Insightly object type'
  });

const recordIdSchema = z
  .number()
  .int('Record ID must be an integer')
  .positive('Record ID must be a positive number');

const recordNameSchema = z
  .string()
  .min(1, 'Record name is required')
  .max(255, 'Record name must be 255 characters or less');

// Schema objects (following ActivePieces pattern)
export const findRecords = {
  pod: podSchema,
  objectName: objectTypeSchema,
  fieldName: z.string().optional(),
  fieldValue: z.string().optional(),
  updatedAfterUtc: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      'Updated After must be a valid ISO date string (e.g., 2025-01-01T00:00:00Z)'
    ),
  brief: z.boolean().optional(),
  skip: z.number().int().min(0, 'Skip must be 0 or greater').optional(),
  top: z
    .number()
    .int()
    .min(1, 'Top must be at least 1')
    .max(500, 'Top cannot exceed 500')
    .optional(),
  countTotal: z.boolean().optional()
};

export const createRecord = {
  pod: podSchema,
  objectName: objectTypeSchema,
  recordName: recordNameSchema,
  ownerUserId: z.number().int().positive().optional(),
  visibleTo: z.enum(['Everyone', 'Owner', 'Team']).optional(),
  visibleTeamId: z.number().int().positive().optional(),
  customFields: z.record(z.string(), z.any()).optional()
};

export const updateRecord = {
  pod: podSchema,
  objectName: objectTypeSchema,
  recordId: recordIdSchema,
  recordName: z
    .string()
    .max(255, 'Record name must be 255 characters or less')
    .optional(),
  ownerUserId: z.number().int().positive().optional(),
  visibleTo: z.enum(['Everyone', 'Owner', 'Team']).optional(),
  visibleTeamId: z.number().int().positive().optional(),
  customFields: z.record(z.string(), z.any()).optional()
};

export const getRecord = {
  pod: podSchema,
  objectName: objectTypeSchema,
  recordId: recordIdSchema
};

export const deleteRecord = {
  pod: podSchema,
  objectName: objectTypeSchema,
  recordId: recordIdSchema,
  confirmDeletion: z.boolean().refine(val => val === true, {
    message: 'You must confirm deletion by checking the confirmation box'
  })
};

export const newRecordTrigger = {
  pod: podSchema,
  objectType: objectTypeSchema
};

export const updatedRecordTrigger = {
  pod: podSchema,
  objectType: objectTypeSchema
};

export const deletedRecordTrigger = {
  pod: podSchema,
  objectType: objectTypeSchema
};