import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { describe, expect, it } from 'vitest';
import {
  createFolderBatchLaunchOutputSchema,
  createFolderBatchStatusOutputSchema,
  deleteBatchLaunchOutputSchema,
  deleteBatchStatusOutputSchema,
  entryOperationOutputSchema,
  relocationLaunchOutputSchema,
  relocationStatusOutputSchema,
  saveUrlLaunchOutputSchema,
} from './output-schemas';

function collectKeys(fields: OutputSchemaField[] | undefined): string[] {
  if (fields === undefined) {
    return [];
  }
  return fields.flatMap((field) => [
    field.key,
    ...collectKeys(field.children),
    ...collectKeys(field.listItems),
  ]);
}

const allSchemas: Record<string, OutputSchema> = {
  saveUrlLaunchOutputSchema,
  relocationLaunchOutputSchema,
  relocationStatusOutputSchema,
  deleteBatchLaunchOutputSchema,
  deleteBatchStatusOutputSchema,
  createFolderBatchLaunchOutputSchema,
  createFolderBatchStatusOutputSchema,
  entryOperationOutputSchema,
};

describe('Dropbox union discriminator paths', () => {
  it.each(Object.entries(allSchemas))(
    'escapes the .tag discriminator in %s',
    (_name, schema) => {
      for (const key of collectKeys(schema.fields)) {
        if (!key.includes('tag')) {
          continue;
        }
        expect(key).toContain("['.tag']");
        expect(key).not.toMatch(/(^|\.)\.?tag$/);
      }
    }
  );
});

describe('async job schemas describe both union branches', () => {
  it.each([
    ['saveUrlLaunchOutputSchema', saveUrlLaunchOutputSchema],
    ['relocationLaunchOutputSchema', relocationLaunchOutputSchema],
    ['deleteBatchLaunchOutputSchema', deleteBatchLaunchOutputSchema],
    ['createFolderBatchLaunchOutputSchema', createFolderBatchLaunchOutputSchema],
  ])(
    '%s exposes async_job_id alongside the inline-complete fields',
    (_name, schema) => {
      const keys = collectKeys(schema.fields);
      expect(keys).toContain('async_job_id');
      expect(keys).toContain("['.tag']");
      expect(keys.length).toBeGreaterThan(2);
    }
  );
});

describe('batch status schemas surface per-entry outcomes', () => {
  it.each([
    ['relocationStatusOutputSchema', relocationStatusOutputSchema],
    ['deleteBatchStatusOutputSchema', deleteBatchStatusOutputSchema],
    ['createFolderBatchStatusOutputSchema', createFolderBatchStatusOutputSchema],
  ])('%s exposes a per-entry failure reason', (_name, schema) => {
    expect(collectKeys(schema.fields)).toContain("failure['.tag']");
  });
});

describe('entryOperationOutputSchema', () => {
  it('labels the result as an entry rather than a file, since folders are accepted', () => {
    expect(entryOperationOutputSchema.fields[0].label).toBe('Entry');
  });

  it('carries the kind discriminator so folder results are distinguishable', () => {
    expect(collectKeys(entryOperationOutputSchema.fields)).toContain("['.tag']");
  });
});
