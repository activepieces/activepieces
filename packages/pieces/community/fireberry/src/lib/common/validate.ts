export function validateRequiredFields(fields: Record<string, any>, required: string[]) {
  for (const key of required) {
    if (fields[key] === undefined || fields[key] === null || fields[key] === '') {
      throw new Error(`Missing required field: ${key}`);
    }
  }
}

export function validateBatchSize(records: any[], max: number) {
  if (!Array.isArray(records)) throw new Error('Records must be an array');
  if (records.length === 0) throw new Error('At least one record is required');
  if (records.length > max) throw new Error(`Batch size exceeds limit (${max})`);
}

export function validateIds(records: any[], idField: string) {
  for (const rec of records) {
    if (!rec[idField]) throw new Error(`Each record must include a valid ${idField}`);
  }
}

export function validateApiResponse(response: any, expectedFields: string[]) {
  if (!response || typeof response !== 'object') throw new Error('Invalid API response');
  for (const field of expectedFields) {
    if (!(field in response)) throw new Error(`API response missing expected field: ${field}`);
  }
}

export function checkPartialFailures(response: any) {
  if (response && Array.isArray(response.results)) {
    const failed = response.results.filter((r: any) => r.status !== 'success');
    if (failed.length > 0) {
      throw new Error(`Partial failure: ${failed.length} records failed`);
    }
  }
} 