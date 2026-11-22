import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { insightlyClient, InsightlyError, insightlyUtils } from './client';

function getApiKey(auth: AppConnectionValueForAuthProperty<typeof insightlyAuth>): string {
  return auth.secret_text.trim();
}

async function connect({ auth, pod }: { auth: AppConnectionValueForAuthProperty<typeof insightlyAuth>; pod?: unknown }): Promise<InsightlyConnection> {
  const apiKey = getApiKey(auth);
  const resolvedPod = await insightlyClient.resolvePod({ apiKey, pod });
  return { apiKey, pod: resolvedPod };
}

async function call({ connection, method, path, query, body }: CallParams): Promise<unknown> {
  return insightlyClient.request({ apiKey: connection.apiKey, pod: connection.pod, method, path, query, body });
}

function idKeyFor(objectName: string): string {
  const key = OBJECT_ID_KEYS[objectName];
  if (!key) {
    throw new InsightlyError({ message: `Unsupported Insightly object type "${objectName}".`, status: 400 });
  }
  return key;
}

function ensureObject(objectName: unknown): string {
  if (typeof objectName === 'string' && OBJECT_ID_KEYS[objectName]) {
    return objectName;
  }
  throw new InsightlyError({ message: 'Select a supported Insightly object type.', status: 400 });
}

function recordIdOf({ record, objectName }: { record: Record<string, unknown>; objectName: string }): string | null {
  return insightlyUtils.readString(record[idKeyFor(objectName)]);
}

function recordNameOf(record: Record<string, unknown>): string | null {
  const first = insightlyUtils.readString(record['FIRST_NAME']) ?? '';
  const last = insightlyUtils.readString(record['LAST_NAME']) ?? '';
  const person = `${first} ${last}`.trim();
  if (person) {
    return person;
  }
  for (const key of ['ORGANISATION_NAME', 'OPPORTUNITY_NAME', 'PROJECT_NAME', 'PRODUCT_NAME', 'QUOTATION_NAME', 'TITLE']) {
    const value = insightlyUtils.readString(record[key]);
    if (value) {
      return value;
    }
  }
  return null;
}

async function assertStageInPipeline({ connection, pipelineId, stageId }: { connection: InsightlyConnection; pipelineId: number; stageId: number }): Promise<void> {
  const stage = insightlyUtils.sanitizeRecord(await call({ connection, method: HttpMethod.GET, path: `/PipelineStages/${stageId}` }));
  if (insightlyUtils.readNumber(stage['PIPELINE_ID']) !== pipelineId) {
    throw new InsightlyError({ message: `Stage ${stageId} does not belong to pipeline ${pipelineId}.`, status: 400 });
  }
}

async function setPipelineStage({ connection, objectName, recordId, pipelineId, stageId }: SetStageParams): Promise<Record<string, unknown>> {
  await assertStageInPipeline({ connection, pipelineId, stageId });
  const current = insightlyUtils.sanitizeRecord(await call({ connection, method: HttpMethod.GET, path: `/${objectName}/${recordId}` }));
  const updated =
    insightlyUtils.readNumber(current['PIPELINE_ID']) === pipelineId
      ? await call({ connection, method: HttpMethod.PUT, path: `/${objectName}/${recordId}/PipelineStage`, body: { STAGE_ID: stageId } })
      : await call({ connection, method: HttpMethod.PUT, path: `/${objectName}/${recordId}/Pipeline`, body: { PIPELINE_ID: pipelineId, PIPELINE_STAGE_CHANGE: { STAGE_ID: stageId } } });
  return insightlyUtils.sanitizeRecord(updated);
}

async function findRecords({ connection, objectName, filter, limit }: FindParams): Promise<{ records: Record<string, unknown>[]; hasMore: boolean }> {
  const page = await insightlyClient.paginate({
    apiKey: connection.apiKey,
    pod: connection.pod,
    path: filter ? `/${objectName}/Search` : `/${objectName}`,
    query: filter ? { field_name: filter.field, field_value: filter.value, brief: 'true' } : { brief: 'true' },
    limit: filter ? Math.max(limit, EXACT_MATCH_SCAN) : limit,
  });
  const records = page.records.map(insightlyUtils.sanitizeRecord);
  if (!filter) {
    return { records, hasMore: page.hasMore };
  }
  const expected = filter.value.trim().toLowerCase();
  const exact = records.filter((record) => (insightlyUtils.readString(record[filter.field]) ?? '').trim().toLowerCase() === expected);
  return { records: exact.slice(0, limit), hasMore: page.hasMore || exact.length > limit };
}

async function updateFields({ connection, objectName, recordId, fields }: UpdateFieldsParams): Promise<string[]> {
  const changes = insightlyUtils.compact(fields);
  if (Object.keys(changes).length === 0) {
    throw new InsightlyError({ message: 'Provide at least one field to update.', status: 400 });
  }
  await call({ connection, method: HttpMethod.PUT, path: `/${objectName}`, body: { ...changes, [idKeyFor(objectName)]: recordId } });
  return Object.keys(changes);
}

async function validateApiKey({ auth }: { auth: string }): Promise<{ valid: true } | { valid: false; error: string }> {
  try {
    const apiKey = auth.trim();
    const pod = await insightlyClient.resolvePod({ apiKey });
    await insightlyClient.request({ apiKey, pod, method: HttpMethod.GET, path: '/Users/Me' });
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : 'Invalid Insightly API key.' };
  }
}

type CallParams = {
  connection: InsightlyConnection;
  method: HttpMethod;
  path: string;
  query?: Record<string, string>;
  body?: Record<string, unknown> | Record<string, unknown>[];
};

type SetStageParams = { connection: InsightlyConnection; objectName: 'Opportunities' | 'Projects'; recordId: number; pipelineId: number; stageId: number };

type FindParams = { connection: InsightlyConnection; objectName: string; filter?: { field: string; value: string }; limit: number };

type UpdateFieldsParams = { connection: InsightlyConnection; objectName: string; recordId: number; fields: Record<string, unknown> };

type InsightlyConnection = { apiKey: string; pod: string };

const EXACT_MATCH_SCAN = 500;

const OBJECT_ID_KEYS: Record<string, string> = {
  Contacts: 'CONTACT_ID',
  Leads: 'LEAD_ID',
  Opportunities: 'OPPORTUNITY_ID',
  Organisations: 'ORGANISATION_ID',
  Projects: 'PROJECT_ID',
  Tasks: 'TASK_ID',
  Events: 'EVENT_ID',
  Notes: 'NOTE_ID',
  Products: 'PRODUCT_ID',
  Quotations: 'QUOTATION_ID',
};

export const insightlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Enter your Insightly API key. In Insightly open your avatar > User Settings > API section and copy the API key. The pod (e.g. na1, eu1) shown there is detected automatically.',
  required: true,
  validate: validateApiKey,
});

export const INSIGHTLY_OBJECTS = Object.keys(OBJECT_ID_KEYS);

export const OBJECT_OPTIONS = [
  { label: 'Contact', value: 'Contacts' },
  { label: 'Lead', value: 'Leads' },
  { label: 'Opportunity', value: 'Opportunities' },
  { label: 'Organization', value: 'Organisations' },
  { label: 'Project', value: 'Projects' },
  { label: 'Task', value: 'Tasks' },
  { label: 'Event', value: 'Events' },
  { label: 'Product', value: 'Products' },
  { label: 'Quote', value: 'Quotations' },
];

export const podProperty = (description?: string) =>
  Property.ShortText({
    displayName: 'Pod',
    description:
      description ??
      'Optional. Your Insightly pod (e.g. "na1", "eu1"), shown in your API URL https://api.{pod}.insightly.com. Leave empty to detect it automatically.',
    required: false,
  });

export const insightlyCommon = {
  getApiKey,
  connect,
  call,
  idKeyFor,
  ensureObject,
  recordIdOf,
  recordNameOf,
  setPipelineStage,
  assertStageInPipeline,
  findRecords,
  updateFields,
  objectIdKeys: OBJECT_ID_KEYS,
};

export type { InsightlyConnection };
