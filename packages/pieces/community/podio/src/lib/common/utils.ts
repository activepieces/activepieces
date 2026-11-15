import type { QueryParams } from '@activepieces/pieces-common';
import type { DynamicPropsValue } from '@activepieces/pieces-framework';
import type { PodioAppField } from './types';

function formatFieldValues({ appFields, formData }: { appFields: PodioAppField[]; formData: DynamicPropsValue }): Record<string, unknown> {

  const fields: Record<string, unknown> = {};

  for (const field of appFields) {
    const fieldKey = `field_${field.field_id}`;
    const fieldValue = formData[fieldKey];

    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      const fieldType = field.type;

      switch (fieldType) {
        case 'text':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'number':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'money':
          if (typeof fieldValue === 'object' && fieldValue.value) {
            fields[field.field_id] = {
              value: fieldValue.value.toString(),
              currency: fieldValue.currency || 'USD',
            };
          }
          break;

        case 'date':
          if (typeof fieldValue === 'object') {
            const dateObj: Record<string, unknown> = {};
            if (fieldValue.start_date) dateObj['start_date'] = fieldValue.start_date;
            if (fieldValue.start_time) dateObj['start_time'] = fieldValue.start_time;
            if (fieldValue.end_date) dateObj['end_date'] = fieldValue.end_date;
            if (fieldValue.end_time) dateObj['end_time'] = fieldValue.end_time;

            if (Object.keys(dateObj).length > 0) {
              fields[field.field_id] = dateObj;
            }
          }
          break;

        case 'contact':
        case 'member':
        case 'app':
        case 'category':
        case 'status':
        case 'image':
        case 'file':
        case 'duration':
        case 'video':
          fields[field.field_id] = {
            value: Number(fieldValue),
          };
          break;

        case 'progress': {
          const progressValue = Number(fieldValue);
          if (progressValue >= 0 && progressValue <= 100) {
            fields[field.field_id] = {
              value: progressValue,
            };
          }
          break;
        }

        case 'email':
        case 'phone':
          if (typeof fieldValue === 'object' && fieldValue.value) {
            fields[field.field_id] = {
              value: fieldValue.value,
              type: fieldValue.type || (fieldType === 'email' ? 'work' : 'mobile'),
            };
          }
          break;

        case 'location':
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
          break;

        case 'embed':
          if (typeof fieldValue === 'object' && fieldValue.embed) {
            fields[field.field_id] = {
              embed: fieldValue.embed,
              file: fieldValue.file || null,
            };
          }
          break;

        default:
          fields[field.field_id] = {
            value: fieldValue.toString(),
          };
      }
    }
  }

  return fields;
}

function query({ values }: { values: Record<string, string | number | boolean | undefined | null> }): QueryParams {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}

function body({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function toBool({ value }: { value: string | undefined | null }): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export const podioUtils = { formatFieldValues, query, body, toBool };
