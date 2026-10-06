import { Property } from '@activepieces/pieces-framework';

import { RESOURCES, resourceTypeOptions } from './resources';

export const resourceTypeProp = Property.StaticDropdown<string, true>({
  displayName: 'Resource Type',
  description:
    'Which kind of record: user, group, group member, organizational unit, mobile device, Chrome OS device or role assignment.',
  required: true,
  options: { options: resourceTypeOptions },
});

export const recordIdentifierProp = Property.ShortText({
  displayName: 'Record Identifier',
  description: Object.values(RESOURCES)
    .map((def) => `**${def.label}**: ${def.idHint}`)
    .join(' · '),
  required: true,
});

export const parentProp = Property.ShortText({
  displayName: 'Parent Record',
  description: Object.values(RESOURCES)
    .filter((def) => def.parentLabel)
    .map((def) => `Only for **${def.label}**: the ${def.parentLabel}.`)
    .join(' '),
  required: false,
});

export const recordJsonProp = Property.Json({
  displayName: 'Record (JSON)',
  description: `Fields in the Directory API shape of the resource type (camelCase). Examples: ${createExamples()}`,
  required: true,
});

export function parseRecord(value: unknown): Record<string, unknown> {
  const parsed: unknown = typeof value === 'string' ? JSON.parse(value) : value;
  if (!isPlainObject(parsed)) {
    throw new Error('The record must be a JSON object.');
  }
  return parsed;
}

export function stringValues(value: Record<string, unknown> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(value ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)])
  );
}

function createExamples(): string {
  return Object.values(RESOURCES)
    .filter((def) => def.createExample)
    .map((def) => `**${def.label}**: \`${JSON.stringify(def.createExample)}\``)
    .join(' · ');
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
