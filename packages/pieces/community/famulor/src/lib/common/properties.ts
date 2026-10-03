import { Property, type InputPropertyMap } from '@activepieces/pieces-framework';
import type { ApiField, ApiOperation } from './types';
import { famulorResources } from './resources';

function label(name: string): string {
  return name.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function property({ field, operation }: { field: ApiField; operation: ApiOperation }) {
  const options = {
    displayName: label(field.name), required: field.required,
    description: [field.description, field.format === 'uuid' ? 'Use the resource UUID from this workspace.' : undefined].filter(Boolean).join(' '),
  };
  if (field.enum && field.enum.every((value) => typeof value === 'string' || typeof value === 'number')) {
    return Property.StaticDropdown({ ...options, options: { options: field.enum.map((value) => ({ label: String(value), value })) } });
  }
  if (field.type === 'string') {
    const resource = famulorResources.resourceProperty({ field, operation });
    if (resource) return resource;
  }
  if (field.type === 'boolean') return Property.Checkbox(options);
  if (field.type === 'number' || field.type === 'integer') return Property.Number(options);
  if (field.format === 'date-time') return Property.DateTime(options);
  if (['array', 'object', 'json'].includes(field.type)) return Property.Json(options);
  if (field.writeOnly) return Property.ShortText({ ...options, description: `${options.description} Keep this value private.` });
  return Property.ShortText(options);
}

function operationProps(operation: ApiOperation): InputPropertyMap {
  const parameters = Object.fromEntries(operation.parameters.map((field) => [`${field.in}_${field.name}`, property({ field, operation })]));
  const body = operation.body;
  if (!body) return parameters;
  if (!body.fields) return { ...parameters, body: Property.Json({ displayName: 'Request Body', description: `${body.description ?? 'JSON body for this operation.'} See https://docs.famulor.io/api-reference for the complete schema.`, required: body.required }) };
  return {
    ...parameters,
    ...Object.fromEntries(body.fields.map((field) => [`body_${field.name}`, property({ field, operation })])),
    body_extra: Property.Json({ displayName: 'Additional Body Fields', description: 'Optional JSON object for additional documented fields. Named fields above take precedence.', required: false }),
  };
}

export const famulorProperties = { operationProps, label };
