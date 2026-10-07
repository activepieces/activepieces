import { QueryParams } from '@activepieces/pieces-common';
import { BikaConnection } from '../auth';
import { bikaClient, BikaEnvelope, bikaHelpers, bikaParse, BikaRecord } from './client';
import { bikaShape } from './shape';

const HUMAN_DEFAULT_MAX_RECORDS = 100;
const HUMAN_MAX_RECORDS = 1_000;
const HUMAN_DEFAULT_PAGE_SIZE = 100;
const HUMAN_MAX_PAGES = 20;
const PAGE_GAP_MS = 600;
const AGENT_DEFAULT_LIMIT = 20;
const AGENT_MAX_LIMIT = 100;
const AGENT_MAX_DATABASES = 200;

export const bikaOperations = {
  humanCreate,
  humanUpdate,
  humanGet,
  humanDelete,
  humanFind,
  listSpaces,
  listDatabases,
  getFields,
  agentFind,
  agentGet,
  agentCreate,
  agentUpdate,
  agentDelete,
};

async function humanCreate({ auth, spaceId, databaseId, fields }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; fields: unknown }): Promise<BikaEnvelope> {
  const target = ids({ spaceId, databaseId });
  const values = await humanValues({ auth, spaceId: target.spaceId, fields, emptyMessage: 'Fill in at least one field to create a record.' });
  return bikaClient.createRecord({ token: auth.props.token, ...target, fields: values });
}

async function humanUpdate({
  auth,
  spaceId,
  databaseId,
  recordId,
  fields,
}: {
  auth: BikaConnection;
  spaceId: unknown;
  databaseId: unknown;
  recordId: unknown;
  fields: unknown;
}): Promise<BikaEnvelope> {
  const target = ids({ spaceId, databaseId });
  const record = bikaShape.requireId({ value: recordId, label: 'Record ID' });
  const values = await humanValues({ auth, spaceId: target.spaceId, fields, emptyMessage: 'Fill in at least one field to update.' });
  return bikaClient.updateRecord({ token: auth.props.token, ...target, recordId: record, fields: values });
}

async function humanGet({ auth, spaceId, databaseId, recordId }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; recordId: unknown }): Promise<BikaEnvelope> {
  const target = ids({ spaceId, databaseId });
  const record = bikaShape.requireId({ value: recordId, label: 'Record ID' });
  return bikaClient.getRecord({ token: auth.props.token, ...target, recordId: record });
}

async function humanDelete({ auth, spaceId, databaseId, recordId }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; recordId: unknown }): Promise<BikaEnvelope> {
  const target = ids({ spaceId, databaseId });
  const record = bikaShape.requireId({ value: recordId, label: 'Record ID' });
  return bikaClient.deleteRecord({ token: auth.props.token, ...target, recordId: record });
}

async function humanFind({
  auth,
  spaceId,
  databaseId,
  filter,
  maxRecords,
  pageSize,
  offset,
}: {
  auth: BikaConnection;
  spaceId: unknown;
  databaseId: unknown;
  filter: unknown;
  maxRecords: unknown;
  pageSize: unknown;
  offset: unknown;
}) {
  const target = ids({ spaceId, databaseId });
  const max = Math.min(wholeNumber({ value: maxRecords, label: 'Max Records', min: 1, max: Number.MAX_SAFE_INTEGER, fallback: HUMAN_DEFAULT_MAX_RECORDS }), HUMAN_MAX_RECORDS);
  const requestedPage = Math.min(wholeNumber({ value: pageSize, label: 'Page Size', min: 1, max: Number.MAX_SAFE_INTEGER, fallback: HUMAN_DEFAULT_PAGE_SIZE }), 1_000);
  const size = Math.max(requestedPage, Math.ceil(max / HUMAN_MAX_PAGES));
  const filterText = bikaShape.optionalText(filter);
  let cursor = bikaShape.optionalText(offset);
  let records: BikaRecord[] = [];
  let hasMore = true;
  let last: BikaEnvelope | undefined;
  let pages = 0;
  while (records.length < max && hasMore && pages < HUMAN_MAX_PAGES) {
    if (last !== undefined) {
      await bikaHelpers.wait(PAGE_GAP_MS);
    }
    last = await bikaClient.listRecordsPage({
      token: auth.props.token,
      ...target,
      query: recordQuery({ pageSize: Math.min(size, max - records.length), filter: filterText, offset: cursor }),
    });
    pages += 1;
    const page = bikaParse.toRecordPage(last.data);
    records = [...records, ...page.records];
    hasMore = page.hasMore;
    cursor = page.offset;
    if (page.records.length === 0) {
      break;
    }
  }
  const returned = records.slice(0, max);
  return {
    success: true,
    code: last?.code ?? 200,
    message: last?.message ?? 'SUCCESS',
    data: {
      records: returned,
      hasMore: hasMore || records.length > max,
      offset: hasMore && records.length <= max ? cursor ?? null : null,
    },
  };
}

async function listSpaces({ auth }: { auth: BikaConnection }) {
  const response = await bikaClient.listSpaces({ token: auth.props.token });
  const spaces = bikaParse.toSpaces(response.data).map((space) => ({
    id: space.id,
    name: space.name,
    plan: space.plan ?? null,
    member_count: space.memberCount ?? null,
    created_at: space.createdAt ?? null,
  }));
  return { spaces, count: spaces.length };
}

async function listDatabases({ auth, spaceId }: { auth: BikaConnection; spaceId: unknown }) {
  const space = bikaShape.requireId({ value: spaceId, label: 'Space ID' });
  const databases = await bikaClient.listDatabases({ token: auth.props.token, spaceId: space });
  const shaped = databases.slice(0, AGENT_MAX_DATABASES).map((database) => ({
    id: database.id,
    name: database.name,
    path: database.path ?? null,
    parent_id: database.parentId ?? null,
  }));
  return { space_id: space, databases: shaped, count: shaped.length, truncated: databases.length > AGENT_MAX_DATABASES };
}

async function getFields({ auth, spaceId, databaseId }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown }) {
  const target = ids({ spaceId, databaseId });
  const response = await bikaClient.getFields({ token: auth.props.token, ...target });
  const fields = bikaParse.toFields(response.data).map(bikaShape.agentField);
  return { database_id: target.databaseId, fields, count: fields.length };
}

async function agentFind({
  auth,
  spaceId,
  databaseId,
  filter,
  fields,
  sortField,
  sortOrder,
  limit,
  offset,
}: {
  auth: BikaConnection;
  spaceId: unknown;
  databaseId: unknown;
  filter: unknown;
  fields: unknown;
  sortField: unknown;
  sortOrder: unknown;
  limit: unknown;
  offset: unknown;
}) {
  const target = ids({ spaceId, databaseId });
  const size = wholeNumber({ value: limit, label: 'Limit', min: 1, max: AGENT_MAX_LIMIT, fallback: AGENT_DEFAULT_LIMIT });
  const order = bikaShape.optionalText(sortOrder);
  if (order !== undefined && order !== 'asc' && order !== 'desc') {
    throw new Error('Sort Order must be "asc" or "desc".');
  }
  const sort = bikaShape.optionalText(sortField);
  const cursor = bikaShape.optionalText(offset);
  if (sort !== undefined && cursor !== undefined) {
    throw new Error('Bika cannot page through sorted results: its offset ignores the sort. Remove Sort Field to page with Offset, or raise Limit (up to 100) and narrow the Filter.');
  }
  const response = await bikaClient.listRecordsPage({
    token: auth.props.token,
    ...target,
    query: recordQuery({
      pageSize: size,
      filter: bikaShape.optionalText(filter),
      offset: cursor,
      sortField: sort,
      sortOrder: order,
    }),
  });
  const page = bikaParse.toRecordPage(response.data);
  const wanted = textList(fields);
  const records = page.records.slice(0, size).map((record) => (wanted.length === 0 ? record : { ...record, fields: pick({ fields: record.fields, names: wanted }) }));
  const shaped = bikaShape.agentRecords({ records, databaseId: target.databaseId });
  return {
    records: shaped.records,
    count: shaped.records.length,
    has_more: page.hasMore,
    next_offset: sort === undefined ? page.offset ?? null : null,
    truncated_fields: shaped.truncatedFields,
  };
}

async function agentGet({ auth, spaceId, databaseId, recordId }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; recordId: unknown }) {
  const response = await humanGet({ auth, spaceId, databaseId, recordId });
  return flatRecord({ record: bikaParse.toRecord(response.data), databaseId: String(databaseId).trim() });
}

async function agentCreate({ auth, spaceId, databaseId, fields }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; fields: unknown }) {
  const target = ids({ spaceId, databaseId });
  const values = bikaShape.parseFieldsJson({ value: fields, label: 'Fields' });
  const response = await bikaClient.createRecord({ token: auth.props.token, ...target, fields: values });
  return flatRecord({ record: bikaParse.toCreatedRecord(response.data), databaseId: target.databaseId });
}

async function agentUpdate({
  auth,
  spaceId,
  databaseId,
  recordId,
  fields,
}: {
  auth: BikaConnection;
  spaceId: unknown;
  databaseId: unknown;
  recordId: unknown;
  fields: unknown;
}) {
  const target = ids({ spaceId, databaseId });
  const record = bikaShape.requireId({ value: recordId, label: 'Record ID' });
  const values = bikaShape.parseFieldsJson({ value: fields, label: 'Fields' });
  const response = await bikaClient.updateRecord({ token: auth.props.token, ...target, recordId: record, fields: values });
  return flatRecord({ record: bikaParse.toRecord(response.data), databaseId: target.databaseId });
}

async function agentDelete({ auth, spaceId, databaseId, recordId }: { auth: BikaConnection; spaceId: unknown; databaseId: unknown; recordId: unknown }) {
  const response = await humanDelete({ auth, spaceId, databaseId, recordId });
  const data = bikaHelpers.isRecord(response.data) ? response.data : {};
  return {
    id: typeof data['id'] === 'string' ? data['id'] : String(recordId).trim(),
    deleted: data['deleted'] !== false,
  };
}

function flatRecord({ record, databaseId }: { record: BikaRecord; databaseId: string }) {
  const shaped = bikaShape.agentRecord({ record, databaseId });
  return { ...shaped.record, truncated_fields: shaped.truncatedFields };
}

async function humanValues({
  auth,
  spaceId,
  fields,
  emptyMessage,
}: {
  auth: BikaConnection;
  spaceId: string;
  fields: unknown;
  emptyMessage: string;
}): Promise<Record<string, unknown>> {
  const cleaned = bikaShape.cleanHumanFields(fields);
  if (Object.keys(cleaned).length === 0) {
    throw new Error(emptyMessage);
  }
  return bikaShape.uploadFiles({ token: auth.props.token, spaceId, fields: cleaned });
}

function ids({ spaceId, databaseId }: { spaceId: unknown; databaseId: unknown }) {
  return {
    spaceId: bikaShape.requireId({ value: spaceId, label: 'Space ID' }),
    databaseId: bikaShape.requireId({ value: databaseId, label: 'Database ID' }),
  };
}

function recordQuery({
  pageSize,
  filter,
  offset,
  sortField,
  sortOrder,
}: {
  pageSize: number;
  filter?: string;
  offset?: string;
  sortField?: string;
  sortOrder?: string;
}): QueryParams {
  const query: QueryParams = { pageSize: String(pageSize), fieldKey: 'name', cellFormat: 'json' };
  if (filter !== undefined) {
    query['filter'] = filter;
  }
  if (offset !== undefined) {
    query['offset'] = offset;
  }
  if (sortField !== undefined) {
    query['sort[0][field]'] = sortField;
    query['sort[0][order]'] = sortOrder ?? 'asc';
  }
  return query;
}

function pick({ fields, names }: { fields: Record<string, unknown>; names: string[] }): Record<string, unknown> {
  return Object.fromEntries(names.filter((name) => name in fields).map((name) => [name, fields[name]]));
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => (typeof item === 'string' && item.trim().length > 0 ? [item.trim()] : []));
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

function wholeNumber({ value, label, min, max, fallback }: { value: unknown; label: string; min: number; max: number; fallback: number }): number {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(max === Number.MAX_SAFE_INTEGER ? `${label} must be a whole number of at least ${min}.` : `${label} must be a whole number from ${min} to ${max}.`);
  }
  return parsed;
}
