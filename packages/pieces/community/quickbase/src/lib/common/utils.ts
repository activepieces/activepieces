import { QuickbaseRecord, QuickbaseField } from './types';

export function generateDeduplicationKey(recordId: string | number, lastModified: string): string {
  return `${recordId}-${lastModified}`;
}

export function mapFieldsToRecord(
  fieldsData: Record<string, any>,
  fields: QuickbaseField[]
): Record<string, { value: any }> {
  const record: Record<string, { value: any }> = {};
  
  for (const [key, value] of Object.entries(fieldsData)) {
    let fieldId: string;
    
    if (/^\d+$/.test(key)) {
      fieldId = key;
    } else {
      const field = fields.find(f => f.label.toLowerCase() === key.toLowerCase());
      if (field) {
        fieldId = field.id.toString();
      } else {
        throw new Error(`Field not found: ${key}`);
      }
    }
    
    record[fieldId] = { value };
  }
  
  return record;
}

export function extractRecordValues(record: QuickbaseRecord): Record<string, any> {
  const values: Record<string, any> = {};
  
  for (const [fieldId, fieldData] of Object.entries(record)) {
    values[fieldId] = fieldData.value;
  }
  
  return values;
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

export function buildWhereClause(filters: Record<string, any>): string {
  const conditions: string[] = [];
  
  for (const [fieldId, value] of Object.entries(filters)) {
    if (value === null || value === undefined) {
      continue;
    }
    
    if (typeof value === 'string') {
      conditions.push(`{${fieldId}.EX.'${value.replace(/'/g, "''")}'}`);
    } else if (typeof value === 'number') {
      conditions.push(`{${fieldId}.EX.${value}}`);
    } else if (typeof value === 'boolean') {
      conditions.push(`{${fieldId}.EX.${value}}`);
    } else if (Array.isArray(value)) {
      const arrayConditions = value.map(v => 
        typeof v === 'string' 
          ? `{${fieldId}.EX.'${v.replace(/'/g, "''")}'}`
          : `{${fieldId}.EX.${v}}`
      );
      conditions.push(`(${arrayConditions.join('OR')})`);
    }
  }
  
  return conditions.join('AND');
}

export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => 
    data[field] === undefined || data[field] === null || data[field] === ''
  );
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}