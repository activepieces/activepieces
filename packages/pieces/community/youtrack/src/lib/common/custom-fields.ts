import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackClient } from './client';
import { resolveProject } from './index';

const MAX_PROJECT_FIELDS = 1000;
const MAX_ALLOWED_VALUES = 200;
const DATE_FIELD_MIDDAY_OFFSET_MS = 12 * 60 * 60 * 1000;
const SCHEMA_FIELDS = 'id,canBeEmpty,emptyFieldText,field(id,name,fieldType(id,isMultiValue))';

const SCHEMA_FIELDS_WITH_VALUES =
  'id,canBeEmpty,emptyFieldText,isPublic,field(id,name,fieldType(id,isMultiValue)),bundle(values(id,name,archived),aggregatedUsers(id,login,fullName))';

const ISSUE_CUSTOM_FIELDS =
  'customFields($type,name,projectCustomField(id,canBeEmpty,emptyFieldText,field(id,name,fieldType(id,isMultiValue))))';

const NAMED_KINDS = new Set(['enum', 'build', 'state', 'version', 'ownedField', 'group']);

const ISSUE_TYPES: Record<string, { single: string; multi?: string }> = {
  enum: { single: 'SingleEnumIssueCustomField', multi: 'MultiEnumIssueCustomField' },
  build: { single: 'SingleBuildIssueCustomField', multi: 'MultiBuildIssueCustomField' },
  state: { single: 'StateIssueCustomField' },
  version: { single: 'SingleVersionIssueCustomField', multi: 'MultiVersionIssueCustomField' },
  ownedField: { single: 'SingleOwnedIssueCustomField', multi: 'MultiOwnedIssueCustomField' },
  user: { single: 'SingleUserIssueCustomField', multi: 'MultiUserIssueCustomField' },
  group: { single: 'SingleGroupIssueCustomField', multi: 'MultiGroupIssueCustomField' },
  integer: { single: 'SimpleIssueCustomField' },
  float: { single: 'SimpleIssueCustomField' },
  date: { single: 'DateIssueCustomField' },
  'date and time': { single: 'SimpleIssueCustomField' },
  period: { single: 'PeriodIssueCustomField' },
  string: { single: 'SimpleIssueCustomField' },
  text: { single: 'TextIssueCustomField' },
};

function parseInput(value: unknown): CustomFieldsInput {
  if (value === null || value === undefined || value === '') {
    return { kind: 'none' };
  }
  if (typeof value === 'string') {
    const text = value.trim();
    if (text === '') return { kind: 'none' };
    try {
      return parseInput(JSON.parse(text));
    } catch {
      throw new Error(`Custom Fields (JSON) is not valid JSON. ${EXAMPLE_TEXT}`);
    }
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return { kind: 'none' };
    const entries = value.map((entry, index) => {
      if (!youtrackClient.isRecord(entry)) {
        throw new Error(`Custom Fields (JSON) entry ${index + 1} must be an object with "name" and "value". ${EXAMPLE_TEXT}`);
      }
      return entry;
    });
    return { kind: 'array', entries };
  }
  if (youtrackClient.isRecord(value)) {
    if (Object.keys(value).length === 0) return { kind: 'none' };
    return { kind: 'map', map: value };
  }
  throw new Error(`Custom Fields (JSON) must be an object of field names to values, or an array of field objects. ${EXAMPLE_TEXT}`);
}

function needsSchema(input: CustomFieldsInput): boolean {
  if (input.kind === 'map') return true;
  if (input.kind === 'array') return input.entries.some((entry) => typeof entry['$type'] !== 'string');
  return false;
}

async function fetchProjectFields({ auth, projectId, withValues }: { auth: unknown; projectId: string; withValues: boolean }): Promise<ProjectField[]> {
  const rows = await youtrackClient.listAll({
    auth,
    path: `/admin/projects/${youtrackClient.segment({ value: projectId, label: 'Project' })}/customFields`,
    query: { fields: withValues ? SCHEMA_FIELDS_WITH_VALUES : SCHEMA_FIELDS },
    maxItems: MAX_PROJECT_FIELDS,
    operation: 'read the custom fields of the project',
  });
  return rows.map(toProjectField).filter((field): field is ProjectField => field !== null);
}

async function fieldsForProject({ auth, projectId, withValues }: { auth: unknown; projectId: string; withValues: boolean }): Promise<{ fields: ProjectField[]; source: FieldsSource }> {
  const fields = await fetchProjectFields({ auth, projectId, withValues });
  if (fields.length > 0) return { fields, source: 'project settings' };
  const project = await resolveProject({ auth, value: projectId });
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/issues',
    query: { query: `project: {${project.shortName}}`, fields: `id,${ISSUE_CUSTOM_FIELDS}`, $top: 1 },
    operation: 'read the custom fields of an issue in the project',
  });
  const sample = youtrackClient.records(body)[0];
  if (sample === undefined) {
    throw new Error(
      `The token user cannot read the custom field settings of project ${project.shortName} (that needs project admin rights), and the project has no issue to read them from. Pass Custom Fields (JSON) as entries with "$type", for example [{ "name": "Priority", "$type": "SingleEnumIssueCustomField", "value": { "name": "Critical" } }].`
    );
  }
  return { fields: issueFieldsOf(sample), source: 'sample issue' };
}

async function fieldsFromIssue({ auth, issue }: { auth: unknown; issue: unknown }): Promise<ProjectField[]> {
  const body = await youtrackClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `/issues/${youtrackClient.segment({ value: issue, label: 'Issue' })}`,
    query: { fields: ISSUE_CUSTOM_FIELDS },
    operation: 'read the custom fields of the issue',
  });
  return issueFieldsOf(youtrackClient.recordOf(body));
}

function issueFieldsOf(issue: Record<string, unknown>): ProjectField[] {
  return youtrackClient.records(issue['customFields'])
    .map(toIssueField)
    .filter((field): field is ProjectField => field !== null);
}

function toIssueField(row: Record<string, unknown>): ProjectField | null {
  const parsed = toProjectField(youtrackClient.recordOf(row['projectCustomField']));
  if (parsed === null) return null;
  const issueType = youtrackClient.optionalText(row['$type']);
  return issueType === undefined ? parsed : { ...parsed, issueFieldType: issueType };
}

function toProjectField(row: Record<string, unknown>): ProjectField | null {
  const field = youtrackClient.recordOf(row['field']);
  const name = youtrackClient.optionalText(field['name']);
  if (name === undefined) return null;
  const fieldType = youtrackClient.recordOf(field['fieldType']);
  const fieldTypeId = youtrackClient.optionalText(fieldType['id']) ?? 'unknown';
  const kind = fieldTypeId.replace(/\[[^\]]*\]$/, '');
  const isMultiValue = typeof fieldType['isMultiValue'] === 'boolean' ? fieldType['isMultiValue'] : fieldTypeId.endsWith('[*]');
  const bundle = youtrackClient.recordOf(row['bundle']);
  const users = youtrackClient.records(bundle['aggregatedUsers'])
    .map((user) => youtrackClient.optionalText(user['login']))
    .filter((login): login is string => login !== undefined);
  const named = youtrackClient.records(bundle['values'])
    .filter((entry) => entry['archived'] !== true)
    .map((entry) => youtrackClient.optionalText(entry['name']))
    .filter((entryName): entryName is string => entryName !== undefined);
  return {
    id: youtrackClient.textOrNull(row['id']),
    name,
    fieldTypeId,
    kind,
    isMultiValue,
    issueFieldType: issueTypeFor({ kind, isMultiValue }),
    required: row['canBeEmpty'] === false,
    emptyFieldText: youtrackClient.textOrNull(row['emptyFieldText']),
    allowedValues: kind === 'user' ? users : named,
  };
}

function issueTypeFor({ kind, isMultiValue }: { kind: string; isMultiValue: boolean }): string | null {
  const types = ISSUE_TYPES[kind];
  if (types === undefined) return null;
  return isMultiValue ? types.multi ?? types.single : types.single;
}

function describeField(field: ProjectField): Record<string, unknown> {
  return {
    name: field.name,
    fieldTypeId: field.fieldTypeId,
    issueFieldType: field.issueFieldType,
    isMultiValue: field.isMultiValue,
    required: field.required,
    emptyFieldText: field.emptyFieldText,
    allowedValues: field.allowedValues.slice(0, MAX_ALLOWED_VALUES),
    allowedValuesTruncated: field.allowedValues.length > MAX_ALLOWED_VALUES,
  };
}

function findField({ fields, name }: { fields: ProjectField[]; name: string }): ProjectField {
  const exact = fields.find((field) => field.name === name);
  if (exact !== undefined) return exact;
  const lower = name.toLowerCase();
  const loose = fields.find((field) => field.name.toLowerCase() === lower);
  if (loose !== undefined) return loose;
  const names = fields.map((field) => field.name).join(', ');
  throw new Error(`The project has no custom field named "${name.slice(0, 80)}". Its fields are: ${names === '' ? '(none)' : names}. Use List Project Custom Fields to see each field's type and allowed values.`);
}

function coerceValue({ field, value }: { field: ProjectField; value: unknown }): unknown {
  if (value === null) {
    return field.isMultiValue ? [] : null;
  }
  if (field.isMultiValue) {
    const list = Array.isArray(value) ? value : [value];
    return list.map((entry) => coerceSingle({ field, value: entry }));
  }
  if (Array.isArray(value)) {
    throw new Error(`The field "${field.name}" holds one value; got a list.`);
  }
  return coerceSingle({ field, value });
}

function coerceSingle({ field, value }: { field: ProjectField; value: unknown }): unknown {
  if (youtrackClient.isRecord(value)) {
    return value;
  }
  if (NAMED_KINDS.has(field.kind)) {
    return { name: namedValue({ field, value, key: 'name' }) };
  }
  switch (field.kind) {
    case 'user':
      return userValue({ field, value });
    case 'integer':
      return integerValue({ field, value });
    case 'float':
      return floatValue({ field, value });
    case 'date':
      return dateValue({ field, value });
    case 'date and time':
      return dateTimeValue({ field, value });
    case 'period':
      return periodValue({ field, value });
    case 'string':
      return stringValue({ field, value });
    case 'text':
      return { text: namedValue({ field, value, key: 'text' }) };
    default:
      throw new Error(`The field "${field.name}" has the type "${field.fieldTypeId}", which cannot be set from a plain value. Pass it as { "name": "${field.name}", "$type": "<IssueCustomField type>", "value": ... }.`);
  }
}

function namedValue({ field, value, key }: { field: ProjectField; value: unknown; key: string }): string {
  const text = youtrackClient.optionalText(value);
  if (text === undefined) {
    throw new Error(`The field "${field.name}" needs a ${key === 'text' ? 'text' : 'value name'}, like "${field.allowedValues[0] ?? 'Critical'}". Got ${JSON.stringify(value)?.slice(0, 60)}.`);
  }
  return text;
}

function userValue({ field, value }: { field: ProjectField; value: unknown }): Record<string, string> {
  const login = typeof value === 'string' ? youtrackClient.optionalText(value) : undefined;
  if (login === undefined) {
    throw new Error(`The field "${field.name}" needs a user login, like "jane.doe". Use Find Users to look it up.`);
  }
  return { login };
}

function integerValue({ field, value }: { field: ProjectField; value: unknown }): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\s*-?\d+\s*$/.test(value)) return Number(value.trim());
  throw new Error(`The field "${field.name}" needs a whole number. Got ${JSON.stringify(value)?.slice(0, 60)}.`);
}

function floatValue({ field, value }: { field: ProjectField; value: unknown }): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(value)) return Number(value.trim());
  throw new Error(`The field "${field.name}" needs a number, like 2.5. Got ${JSON.stringify(value)?.slice(0, 60)}.`);
}

function dateValue({ field, value }: { field: ProjectField; value: unknown }): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const epoch = youtrackClient.parseDate({ value, label: `The field "${field.name}"` });
  if (epoch === undefined) {
    throw new Error(`The field "${field.name}" needs a date in the form YYYY-MM-DD. Use null to clear it.`);
  }
  return epoch + DATE_FIELD_MIDDAY_OFFSET_MS;
}

function dateTimeValue({ field, value }: { field: ProjectField; value: unknown }): number {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  const epoch = youtrackClient.parseDateOrDateTime({ value, label: `The field "${field.name}"` });
  if (epoch === undefined) {
    throw new Error(`The field "${field.name}" needs an ISO-8601 date-time like 2026-12-01T09:30:00Z. Use null to clear it.`);
  }
  return epoch;
}

function periodValue({ field, value }: { field: ProjectField; value: unknown }): Record<string, unknown> {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 0) return { minutes: value };
  const text = typeof value === 'string' ? youtrackClient.optionalText(value) : undefined;
  if (text === undefined) {
    throw new Error(`The field "${field.name}" needs a duration like "2h 30m" or a number of minutes.`);
  }
  if (/^\d+$/.test(text)) return { minutes: Number(text) };
  return { presentation: text };
}

function stringValue({ field, value }: { field: ProjectField; value: unknown }): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  throw new Error(`The field "${field.name}" needs a text value.`);
}

function buildEntry({ field, value }: { field: ProjectField; value: unknown }): Record<string, unknown> {
  if (field.issueFieldType === null) {
    throw new Error(`The field "${field.name}" has the type "${field.fieldTypeId}", which this action cannot map. Pass it as { "name": "${field.name}", "$type": "<IssueCustomField type>", "value": ... }.`);
  }
  return { name: field.name, $type: field.issueFieldType, value: coerceValue({ field, value }) };
}

async function resolveCustomFields({ value, loadFields }: { value: unknown; loadFields: () => Promise<ProjectField[]> }): Promise<Record<string, unknown>[] | undefined> {
  const input = parseInput(value);
  if (input.kind === 'none') return undefined;
  if (!needsSchema(input)) {
    return input.kind === 'array' ? input.entries : undefined;
  }
  const fields = await loadFields();
  if (input.kind === 'map') {
    return Object.entries(input.map).map(([name, fieldValue]) => buildEntry({ field: findField({ fields, name }), value: fieldValue }));
  }
  return input.entries.map((entry, index) => {
    if (typeof entry['$type'] === 'string') return entry;
    const name = youtrackClient.optionalText(entry['name']);
    if (name === undefined) {
      throw new Error(`Custom Fields (JSON) entry ${index + 1} has no "name". ${EXAMPLE_TEXT}`);
    }
    if (!('value' in entry)) {
      throw new Error(`Custom Fields (JSON) entry ${index + 1} ("${name}") has no "value". Use null to clear the field.`);
    }
    return buildEntry({ field: findField({ fields, name }), value: entry['value'] });
  });
}

const EXAMPLE_TEXT =
  'Example: { "Priority": "Critical", "Assignee": "jane.doe", "Estimation": "2h", "Due Date": "2026-12-01" }.';

export const customFieldsHelper = {
  parseInput,
  fetchProjectFields,
  fieldsForProject,
  fieldsFromIssue,
  toIssueField,
  toProjectField,
  issueTypeFor,
  describeField,
  coerceValue,
  resolveCustomFields,
  MAX_ALLOWED_VALUES,
};

type FieldsSource = 'project settings' | 'sample issue';

type CustomFieldsInput =
  | { kind: 'none' }
  | { kind: 'array'; entries: Record<string, unknown>[] }
  | { kind: 'map'; map: Record<string, unknown> };

export type ProjectField = {
  id: string | null;
  name: string;
  fieldTypeId: string;
  kind: string;
  isMultiValue: boolean;
  issueFieldType: string | null;
  required: boolean;
  emptyFieldText: string | null;
  allowedValues: string[];
};
