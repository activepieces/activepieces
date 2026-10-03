import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import FormData from 'form-data';

const BASE_URL = 'https://app.asana.com/api/1.0';
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_TAG_PAGES = 20;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):(\d{2}))$/i;
const MAX_PRECISION = 6;
const MAX_ERROR_BODY_LENGTH = 300;
const GID_PATTERN = /^\d+$/;

const RATE_LIMIT_GUIDANCE =
  'Asana allows about 150 requests per minute on free workspaces and 1,500 on paid ones, plus concurrency and cost limits. Wait about a minute (Asana sends the exact delay in its Retry-After header) before retrying; rejected requests still count against the quota.';

function extractVendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string' && body.trim() !== '') {
    const trimmed = body.trim();
    return trimmed.length > MAX_ERROR_BODY_LENGTH ? `${trimmed.slice(0, MAX_ERROR_BODY_LENGTH)}...` : trimmed;
  }
  if (typeof body !== 'object' || body === null || !('errors' in body)) {
    return undefined;
  }
  const errors = body.errors;
  if (!Array.isArray(errors)) {
    return undefined;
  }
  const messages: string[] = [];
  for (const entry of errors) {
    if (typeof entry === 'object' && entry !== null && 'message' in entry && typeof entry.message === 'string') {
      messages.push(entry.message);
    }
  }
  return messages.length === 0 ? undefined : messages.join('; ');
}

function describeFailure({
  status,
  body,
  operation,
}: {
  status: number;
  body: unknown;
  operation: string;
}): string {
  const vendorMessage = extractVendorMessage(body);
  const vendorSuffix = vendorMessage === undefined ? '' : ` Asana said: "${vendorMessage}".`;
  switch (status) {
    case 400:
      return `Asana rejected ${operation} as invalid.${vendorSuffix}`;
    case 401:
      return `Asana rejected the connection while running ${operation}: the access token is invalid or has expired. Reconnect the Asana account in Activepieces.${vendorSuffix}`;
    case 402:
      return `This Asana feature needs a paid plan: ${operation} is above the current premium level of the workspace (Starter, Advanced or Enterprise is required).${vendorSuffix}`;
    case 403:
      return `Asana refused ${operation}: the connected user does not have permission for this resource or action.${vendorSuffix}`;
    case 404:
      return `Asana could not find the resource for ${operation}. Check the gid; the object may not exist, may have been deleted, or may not be visible to the connected user.${vendorSuffix}`;
    case 429:
      return `Asana rate limit reached while running ${operation}. ${RATE_LIMIT_GUIDANCE}`;
    default:
      return `Asana returned HTTP ${status} for ${operation}.${vendorSuffix}`;
  }
}

function toQueryParams(query: AsanaQuery | undefined): Record<string, string> {
  const params: Record<string, string> = {};
  if (query === undefined) {
    return params;
  }
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    params[key] = String(value);
  }
  return params;
}

async function asanaApi<T>({
  auth,
  method,
  path,
  query,
  data,
  form,
  operation,
}: AsanaRequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
      queryParams: toQueryParams(query),
      body: form ?? (data === undefined ? undefined : { data }),
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new AsanaApiError({
        status,
        message: describeFailure({ status, body: error.response.body, operation }),
      });
    }
    throw error;
  }
}

async function asanaData<T>(params: AsanaRequestParams): Promise<T> {
  const body = await asanaApi<AsanaEnvelope<T>>(params);
  return body.data;
}

async function asanaEmpty(params: AsanaRequestParams): Promise<void> {
  await asanaApi<unknown>(params);
}

function assertLimit(limit: number | undefined | null): number {
  if (limit === undefined || limit === null) {
    return DEFAULT_LIMIT;
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    throw new Error(`Limit must be a whole number between 1 and ${MAX_LIMIT}, got ${limit}.`);
  }
  return limit;
}

async function asanaListPage<T>({
  auth,
  path,
  query,
  limit,
  offset,
  operation,
}: AsanaListParams): Promise<AsanaPage<T>> {
  const body = await asanaApi<AsanaListEnvelope<T>>({
    auth,
    method: HttpMethod.GET,
    path,
    operation,
    query: {
      ...query,
      limit: assertLimit(limit),
      offset: hasValue(offset) ? offset : undefined,
    },
  });
  const data = Array.isArray(body.data) ? body.data : [];
  const nextOffset = body.next_page?.offset;
  return {
    data,
    next_offset: typeof nextOffset === 'string' && nextOffset !== '' ? nextOffset : null,
  };
}

async function fetchWorkspaceTags({
  auth,
  workspace,
}: {
  auth: AsanaAuth;
  workspace: string;
}): Promise<{ tags: AsanaNamedRecord[]; truncated: boolean }> {
  const tags: AsanaNamedRecord[] = [];
  let offset: string | null = null;
  for (let page = 0; page < MAX_TAG_PAGES; page++) {
    const result: AsanaPage<AsanaNamedRecord> = await asanaListPage<AsanaNamedRecord>({
      auth,
      path: '/tags',
      query: { workspace, opt_fields: 'name' },
      limit: MAX_LIMIT,
      offset: offset ?? undefined,
      operation: 'Create Project Task (tag lookup)',
    });
    tags.push(...result.data);
    offset = result.next_offset;
    if (offset === null) {
      break;
    }
  }
  return { tags, truncated: offset !== null };
}

async function isExistingTagGid({ auth, gid }: { auth: AsanaAuth; gid: string }): Promise<boolean> {
  try {
    await asanaApi<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/tags/${encodeURIComponent(gid)}`,
      query: { opt_fields: 'name' },
      operation: 'Create Project Task (tag gid check)',
    });
    return true;
  } catch (error) {
    if (error instanceof AsanaApiError && (error.status === 404 || error.status === 400)) {
      return false;
    }
    throw error;
  }
}

async function resolveTagGids({
  auth,
  workspace,
  tags,
}: {
  auth: AsanaAuth;
  workspace: string;
  tags: string[];
}): Promise<string[]> {
  const pending: string[] = [];
  const confirmedGids = new Set<string>();
  for (const tag of tags) {
    if (GID_PATTERN.test(tag) && (await isExistingTagGid({ auth, gid: tag }))) {
      confirmedGids.add(tag);
      continue;
    }
    pending.push(tag);
  }
  const byName = new Map<string, string>();
  let truncated = false;
  if (pending.length > 0) {
    const lookup = await fetchWorkspaceTags({ auth, workspace });
    truncated = lookup.truncated;
    for (const candidate of lookup.tags) {
      if (typeof candidate.name === 'string' && !byName.has(candidate.name.toLowerCase())) {
        byName.set(candidate.name.toLowerCase(), candidate.gid);
      }
    }
  }
  const missing: string[] = [];
  const gids: string[] = [];
  for (const tag of tags) {
    if (confirmedGids.has(tag)) {
      gids.push(tag);
      continue;
    }
    const match = byName.get(tag.toLowerCase());
    if (match === undefined) {
      missing.push(tag);
      continue;
    }
    gids.push(match);
  }
  if (missing.length > 0) {
    const names = missing.map((name) => `"${name}"`).join(', ');
    if (truncated) {
      throw new Error(
        `Tag ${names} was not found in the first ${(MAX_TAG_PAGES * MAX_LIMIT).toLocaleString('en-US')} tags of workspace ${workspace}; pass the tag gid instead (find it with List Tags or Search Workspace Objects).`
      );
    }
    throw new Error(
      `No tag named ${names} exists in workspace ${workspace}. Create it first with Create Tag, or pass existing tag gids from List Tags.`
    );
  }
  return gids;
}

function hasValue(value: unknown): boolean {
  return value !== undefined && value !== null && value !== '';
}

function toStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return toStringArray(parseListString(value));
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item) => typeof item === 'string' || typeof item === 'number')
    .map((item) => String(item).trim())
    .filter((item) => item !== '');
}

function parseListString(value: string): unknown[] {
  const trimmed = value.trim();
  if (trimmed.startsWith('[')) {
    const parsed = parseJson(trimmed);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }
  return trimmed.split(',');
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function isCalendarDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00Z`);
  return DATE_PATTERN.test(value) && !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isInRange({ value, max }: { value: string | undefined; max: number }): boolean {
  return value === undefined || Number(value) <= max;
}

function assertPrecision(value: number | undefined | null): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > MAX_PRECISION) {
    throw new Error(`Decimal Places must be a whole number from 0 to ${MAX_PRECISION}, got ${value}.`);
  }
  return value;
}

function assertDate({ value, field }: { value: string; field: string }): string {
  const trimmed = value.trim();
  if (!isCalendarDate(trimmed)) {
    throw new Error(`${field} must be a calendar date in YYYY-MM-DD format, got "${value}".`);
  }
  return trimmed;
}

function assertDateTime({ value, field }: { value: string; field: string }): string {
  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  const match = DATE_TIME_PATTERN.exec(trimmed);
  const validParts =
    match !== null &&
    isCalendarDate(trimmed.slice(0, 10)) &&
    isInRange({ value: match[1], max: 23 }) &&
    isInRange({ value: match[2], max: 59 }) &&
    isInRange({ value: match[3], max: 59 }) &&
    isInRange({ value: match[4], max: 23 }) &&
    isInRange({ value: match[5], max: 59 });
  if (!validParts || Number.isNaN(parsed.getTime())) {
    throw new Error(
      `${field} must be an ISO 8601 date-time with a time part that ends in Z or a +hh:mm/-hh:mm offset, such as 2026-10-01T15:00:00Z or 2026-10-01T17:00:00+02:00, got "${value}". Use the date-only field for an all-day date.`
    );
  }
  return parsed.toISOString();
}

function assertNotBoth({
  first,
  second,
  firstLabel,
  secondLabel,
}: {
  first: unknown;
  second: unknown;
  firstLabel: string;
  secondLabel: string;
}): void {
  if (hasValue(first) && hasValue(second)) {
    throw new Error(`Set either ${firstLabel} or ${secondLabel}, not both; Asana accepts only one of them.`);
  }
}

function assertNotEmpty({ patch, fields }: { patch: Record<string, unknown>; fields: string }): void {
  if (Object.keys(patch).length === 0) {
    throw new Error(`Nothing to update: set at least one of ${fields}.`);
  }
}

function pathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function toGidValuePairs({
  value,
  field,
}: {
  value: unknown[] | undefined | null;
  field: string;
}): { gid: string; value: string }[] {
  if (value === undefined || value === null) {
    return [];
  }
  return value.map((entry, index) => {
    const gid = readStringField({ entry, key: 'gid' });
    const pairValue = readStringField({ entry, key: 'value' });
    if (gid === undefined || pairValue === undefined) {
      throw new Error(`${field} row ${index + 1} needs both a GID and a value.`);
    }
    return { gid, value: pairValue };
  });
}

function buildAllocationEffort({
  type,
  value,
}: {
  type: string | undefined | null;
  value: number | undefined | null;
}): { type: string; value: number } | undefined {
  const hasType = typeof type === 'string' && type !== '';
  const hasNumber = typeof value === 'number';
  if (hasType !== hasNumber) {
    throw new Error('Set Effort Unit and Effort Value together, or leave both empty.');
  }
  if (typeof type !== 'string' || typeof value !== 'number') {
    return undefined;
  }
  if (value < 0) {
    throw new Error(`Effort Value must not be negative, got ${value}.`);
  }
  return { type, value };
}

function readStringField({ entry, key }: { entry: unknown; key: string }): string | undefined {
  if (typeof entry !== 'object' || entry === null || !(key in entry)) {
    return undefined;
  }
  const raw: unknown = Reflect.get(entry, key);
  if (typeof raw !== 'string' && typeof raw !== 'number') {
    return undefined;
  }
  const trimmed = String(raw).trim();
  return trimmed === '' ? undefined : trimmed;
}

function optionalBooleanProp({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.StaticDropdown<boolean>({
    displayName,
    description,
    required: false,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

function limitProp({ noun }: { noun: string }) {
  return Property.Number({
    displayName: 'Limit',
    description: `Maximum number of ${noun} to return in this page, from 1 to ${MAX_LIMIT}. Defaults to ${DEFAULT_LIMIT}.`,
    required: false,
  });
}

function offsetProp() {
  return Property.ShortText({
    displayName: 'Offset',
    description:
      'Pagination token for the next page. Pass the `next_offset` value returned by the previous call of this same action; leave empty for the first page. Tokens expire after a while.',
    required: false,
  });
}

export class AsanaApiError extends Error {
  public readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'AsanaApiError';
    this.status = status;
  }
}

export const asanaClient = {
  asanaApi,
  asanaData,
  asanaEmpty,
  asanaListPage,
  resolveTagGids,
};

export const asanaProps = {
  optionalBoolean: optionalBooleanProp,
  limit: limitProp,
  offset: offsetProp,
};

export const asanaUtils = {
  hasValue,
  toStringArray,
  assertDate,
  assertDateTime,
  assertNotBoth,
  assertNotEmpty,
  assertLimit,
  pathSegment,
  toGidValuePairs,
  buildAllocationEffort,
  assertPrecision,
};

export const ASANA_MAX_PRECISION = MAX_PRECISION;

export const ASANA_COLOR_OPTIONS = [
  'dark-pink',
  'dark-green',
  'dark-blue',
  'dark-red',
  'dark-teal',
  'dark-brown',
  'dark-orange',
  'dark-purple',
  'dark-warm-gray',
  'light-pink',
  'light-green',
  'light-blue',
  'light-red',
  'light-teal',
  'light-brown',
  'light-orange',
  'light-purple',
  'light-warm-gray',
].map((color) => ({ label: color, value: color }));

export const ASANA_TEAM_VISIBILITY_OPTIONS = [
  { label: 'Public to the organization', value: 'public' },
  { label: 'Membership by request', value: 'request_to_join' },
  { label: 'Private (secret)', value: 'secret' },
];

export const ASANA_CUSTOM_FIELD_FORMAT_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Currency', value: 'currency' },
  { label: 'Percentage', value: 'percentage' },
  { label: 'Custom label', value: 'custom' },
  { label: 'Duration', value: 'duration' },
  { label: 'Identifier', value: 'identifier' },
];

export const ASANA_CUSTOM_LABEL_POSITION_OPTIONS = [
  { label: 'Before the value (prefix)', value: 'prefix' },
  { label: 'After the value (suffix)', value: 'suffix' },
];

export const ASANA_EFFORT_TYPE_OPTIONS = [
  { label: 'Hours', value: 'hours' },
  { label: 'Percent of time', value: 'percent' },
];

export const ASANA_FIELDS = {
  task: 'name,resource_subtype,notes,completed,completed_at,created_at,modified_at,due_on,due_at,start_on,start_at,assignee.name,assignee.email,parent.name,projects.name,memberships.project.name,memberships.section.name,tags.name,followers.name,workspace.name,num_subtasks,permalink_url',
  taskList: 'name,resource_subtype,completed,completed_at,created_at,modified_at,due_on,due_at,start_on,assignee.name,parent.name,permalink_url',
  project: 'name,archived,color,completed,completed_at,created_at,modified_at,default_view,due_on,start_on,notes,owner.name,privacy_setting,team.name,workspace.name,current_status_update.title,current_status_update.status_type,project_brief,members.name,followers.name,permalink_url',
  projectList: 'name,archived,color,created_at,modified_at,due_on,start_on,owner.name,privacy_setting,team.name,permalink_url',
  story: 'created_at,created_by.name,resource_subtype,type,text,html_text,is_pinned,is_edited,is_editable,sticker_name,target.name',
  storyList: 'created_at,created_by.name,resource_subtype,type,text,is_pinned,is_edited',
  section: 'name,created_at,project.name',
  tag: 'name,color,notes,created_at,followers.name,workspace.name,permalink_url',
  tagList: 'name,color,created_at,permalink_url',
  job: 'resource_subtype,status,new_task.name,new_project.name,new_project_template.name',
  statusUpdate: 'title,text,status_type,resource_subtype,created_at,modified_at,author.name,created_by.name,parent.name',
  projectBrief: 'title,text,html_text,permalink_url,project.name',
  user: 'name,email,workspaces.name',
  workspace: 'name,is_organization,email_domains',
  team: 'name,description,visibility,organization.name,permalink_url',
  teamFull: 'name,description,html_description,visibility,endorsed,organization.name,permalink_url',
  userList: 'name,email',
  workspaceMembership: 'user.name,workspace.name,is_active,is_admin,is_guest,is_view_only,created_at',
  teamMembership: 'user.name,team.name,is_admin,is_guest,is_limited_access',
  attachment: 'name,resource_subtype,created_at,size,host,download_url,permanent_url,view_url,connected_to_app,parent.name,parent.resource_subtype',
  accessRequest: 'approval_status,message,requester.name,target',
  taskCounts: 'num_tasks,num_completed_tasks,num_incomplete_tasks,num_milestones,num_completed_milestones,num_incomplete_milestones',
  customField: 'name,resource_subtype,description,format,precision,currency_code,custom_label,custom_label_position,has_notifications_enabled,is_global_to_workspace,is_formula_field,is_value_read_only,input_restrictions,id_prefix,privacy_setting,default_access_level,asana_created_field,created_by.name,enum_options.name,enum_options.enabled,enum_options.color',
  customFieldList: 'name,resource_subtype,description,format,precision,is_global_to_workspace,enum_options.name,enum_options.enabled,enum_options.color',
  enumOption: 'name,enabled,color',
  projectTemplate: 'name,description,color,public,owner,team.name,requested_dates.name,requested_dates.description,requested_roles.name',
  taskTemplate: 'name,created_at,created_by,project',
  portfolio: 'name,archived,color,created_at,created_by.name,owner.name,workspace.name,start_on,due_on,privacy_setting,default_access_level,current_status_update.title,members.name,permalink_url',
  portfolioList: 'name,archived,color,created_at,owner.name,start_on,due_on,privacy_setting,permalink_url',
  goal: 'name,notes,html_notes,status,start_on,due_on,is_workspace_level,privacy_setting,owner.name,team.name,workspace.name,time_period.display_name,time_period.start_on,time_period.end_on,metric.resource_subtype,metric.unit,metric.precision,metric.currency_code,metric.initial_number_value,metric.target_number_value,metric.current_number_value,metric.current_display_value,metric.progress_source,current_status_update.title,followers.name,num_likes',
  goalList: 'name,status,start_on,due_on,is_workspace_level,owner.name,team.name,time_period.display_name',
  goalRelationship: 'resource_subtype,contribution_weight,supported_goal.name,supporting_resource.name,supporting_resource.resource_subtype',
  timePeriod: 'display_name,period,start_on,end_on,parent.display_name',
  allocation: 'resource_subtype,start_date,end_date,effort.type,effort.value,assignee.name,parent.name,created_by.name',
  timeTrackingEntry: 'duration_minutes,entered_on,created_by.name,attributable_to.name,categories.name',
  customType: 'name,asana_created_type_identifier,status_options.name,status_options.color,status_options.enabled,status_options.completion_state',
  userInWorkspace: 'name,email,custom_fields.name,custom_fields.display_value',
};

export type AsanaAuth = {
  access_token: string;
};

export type AsanaQuery = Record<string, string | number | boolean | undefined | null>;

export type AsanaRequestParams = {
  auth: AsanaAuth;
  method: HttpMethod;
  path: string;
  operation: string;
  query?: AsanaQuery;
  data?: Record<string, unknown>;
  form?: FormData;
};

export type AsanaListParams = {
  auth: AsanaAuth;
  path: string;
  operation: string;
  query?: AsanaQuery;
  limit?: number | null;
  offset?: string | null;
};

export type AsanaEnvelope<T> = {
  data: T;
};

export type AsanaListEnvelope<T> = {
  data: T[];
  next_page?: { offset?: string; path?: string; uri?: string } | null;
};

export type AsanaPage<T> = {
  data: T[];
  next_offset: string | null;
};

export type AsanaNamedRecord = {
  gid: string;
  name?: string;
  resource_type?: string;
};

export type AsanaRecord = Record<string, unknown>;
