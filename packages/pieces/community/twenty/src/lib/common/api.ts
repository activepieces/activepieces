import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { chunk } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { twentyClient } from './client';
import { recordParamsUtils } from './record-params';
import { twentyTimelineUtils } from './timeline';

import type {
  QueryConditionGroup,
  QueryConditionNode,
  FieldValue,
  TwentyAuthValue,
  TwentyDuplicateConnection,
  TwentyEnvelope,
  TwentyMetadataField,
  TwentyMetadataItem,
  TwentyMetadataPage,
  TwentyMetadataSingle,
  TwentyPageInfo,
  TwentyPersonResponse,
  TwentyRecord,
  TwentyRecordList,
  TwentyRecordPage,
  TwentyResponse,
  TwentyTimelineActivity,
} from './types';

async function checkConnection({
  auth,
}: {
  auth: TwentyAuthValue;
}): Promise<void> {
  await twentyClient.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: '/rest/people',
    query: { 'page[size]': '1' },
  });
}

async function createPerson({
  auth,
  firstName,
  lastName,
  email,
}: CreatePersonParams & { auth: TwentyAuthValue }): Promise<TwentyResponse> {
  return await twentyClient.request<TwentyResponse>({
    auth,
    method: HttpMethod.POST,
    path: '/rest/people',
    body: {
      name: {
        firstName,
        lastName,
      },
      emails: email ? { primaryEmail: email } : undefined,
    },
  });
}

async function createCompany({
  auth,
  name,
  domainName,
  address,
  employees,
}: CompanyFields & {
  auth: TwentyAuthValue;
  name: string;
}): Promise<TwentyResponse> {
  return await twentyClient.request<TwentyResponse>({
    auth,
    method: HttpMethod.POST,
    path: '/rest/companies',
    body: {
      name,
      domainName: domainName
        ? { primaryLinkUrl: domainName, primaryLinkLabel: '' }
        : undefined,
      address: address ? { addressStreet1: address } : undefined,
      employees: employees ?? undefined,
    },
  });
}

async function createOpportunity({
  auth,
  name,
  stage,
  amount,
  currency,
  closeDate,
  companyId,
}: CreateOpportunityParams & {
  auth: TwentyAuthValue;
}): Promise<TwentyResponse> {
  return await twentyClient.request<TwentyResponse>({
    auth,
    method: HttpMethod.POST,
    path: '/rest/opportunities',
    body: {
      name,
      stage: stage ?? undefined,
      amount:
        amount != null
          ? {
              amountMicros: Math.round(amount * 1_000_000),
              currencyCode: currency ?? 'USD',
            }
          : undefined,
      closeDate: closeDate ?? undefined,
      companyId: companyId ?? undefined,
    },
  });
}

async function findCompanies({
  auth,
  name,
  domainName,
}: {
  auth: TwentyAuthValue;
  name?: string;
  domainName?: string;
}): Promise<TwentyRecord[]> {
  return await listAllRecords({
    auth,
    objectNamePlural: 'companies',
    limit: recordParamsUtils.recordLimit.default,
    filter: filterString({
      conditions: [
        { field: 'name', operator: 'ilike', value: name },
        {
          field: 'domainName.primaryLinkUrl',
          operator: 'ilike',
          value: domainName
            ? domainName.replace(/^https?:\/\//i, '')
            : undefined,
        },
      ],
    }),
  });
}

async function findPeople({
  auth,
  email,
  firstName,
  lastName,
}: {
  auth: TwentyAuthValue;
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<TwentyRecord[]> {
  return await listAllRecords({
    auth,
    objectNamePlural: 'people',
    limit: recordParamsUtils.recordLimit.default,
    filter: filterString({
      conditions: [
        {
          field: 'emails.primaryEmail',
          operator: 'ilike',
          value: email,
        },
        {
          field: 'name.firstName',
          operator: 'ilike',
          value: firstName,
        },
        {
          field: 'name.lastName',
          operator: 'ilike',
          value: lastName,
        },
      ],
    }),
  });
}

async function findRecords({
  auth,
  objectNamePlural,
  conditions,
  limit,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  conditions: QueryConditionNode[];
  limit?: number;
}): Promise<TwentyRecord[]> {
  return await listAllRecords({
    auth,
    objectNamePlural,
    filter: filterString({ conditions }),
    limit,
  });
}

async function listRecentCompanies({
  auth,
}: {
  auth: TwentyAuthValue;
}): Promise<TwentyRecord[]> {
  return await listAllRecords({
    auth,
    objectNamePlural: 'companies',
    ...RECENT_RECORDS,
  });
}

async function listRecentPeople({
  auth,
}: {
  auth: TwentyAuthValue;
}): Promise<TwentyRecord[]> {
  return await listAllRecords({
    auth,
    objectNamePlural: 'people',
    ...RECENT_RECORDS,
  });
}

async function updateCompany({
  auth,
  companyId,
  name,
  domainName,
  address,
  employees,
}: CompanyFields & {
  auth: TwentyAuthValue;
  companyId: string;
  name?: string;
}): Promise<TwentyResponse> {
  const body: Record<string, unknown> = {};
  if (name) body['name'] = name;
  if (domainName)
    body['domainName'] = { primaryLinkUrl: domainName, primaryLinkLabel: '' };
  if (address) body['address'] = { addressStreet1: address };
  if (employees != null) body['employees'] = employees;

  if (Object.keys(body).length === 0) {
    return await twentyClient.request<TwentyResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/rest/companies/${companyId}`,
    });
  }

  return await twentyClient.request<TwentyResponse>({
    auth,
    method: HttpMethod.PATCH,
    path: `/rest/companies/${companyId}`,
    body,
  });
}

async function updatePerson({
  auth,
  personId,
  firstName,
  lastName,
  email,
}: Partial<CreatePersonParams> & {
  auth: TwentyAuthValue;
  personId: string;
}): Promise<TwentyPersonResponse> {
  const body: Record<string, unknown> = {};
  if (firstName || lastName) {
    const existing = await getPerson({ auth, personId });
    const existingName = existing.data?.person?.name ?? {};
    body['name'] = {
      firstName: firstName ?? existingName.firstName,
      lastName: lastName ?? existingName.lastName,
    };
  }
  if (email) {
    body['emails'] = { primaryEmail: email };
  }

  if (Object.keys(body).length === 0) {
    return await getPerson({ auth, personId });
  }

  return await twentyClient.request<TwentyPersonResponse>({
    auth,
    method: HttpMethod.PATCH,
    path: `/rest/people/${personId}`,
    body,
  });
}

async function listRecords({
  auth,
  objectNamePlural,
  filter,
  orderBy,
  limit,
  depth,
  fields,
  startingAfter,
}: ListRecordsParams & { auth: TwentyAuthValue }): Promise<TwentyRecordList> {
  const response = await twentyClient.request<TwentyRecordPage>({
    auth,
    method: HttpMethod.GET,
    path: recordsPath({ objectNamePlural }),
    query: compactQuery({
      values: {
        filter,
        order_by: orderBy,
        limit,
        depth,
        fields,
        starting_after: startingAfter,
      },
    }),
  });
  return {
    records: firstValue({ envelope: response }) ?? [],
    pageInfo: response.pageInfo,
    totalCount: response.totalCount,
  };
}

async function listAllRecords({
  auth,
  objectNamePlural,
  filter,
  orderBy,
  depth,
  fields,
  limit,
}: Omit<ListRecordsParams, 'limit' | 'startingAfter'> & {
  auth: TwentyAuthValue;
  limit?: number;
}): Promise<TwentyRecord[]> {
  const records: TwentyRecord[] = [];
  let startingAfter: string | undefined;
  while (limit === undefined || records.length < limit) {
    const remaining =
      limit === undefined ? MAX_PAGE_SIZE : limit - records.length;
    const page = await listRecords({
      auth,
      objectNamePlural,
      filter,
      orderBy,
      depth,
      fields,
      limit: Math.min(remaining, MAX_PAGE_SIZE),
      startingAfter,
    });
    records.push(...page.records);

    const endCursor = page.pageInfo?.endCursor;
    if (!page.pageInfo?.hasNextPage || !endCursor || page.records.length === 0)
      break;
    startingAfter = endCursor;
  }
  return records;
}

async function listTimelines({
  auth,
  targetColumn,
  since,
  until,
}: {
  auth: TwentyAuthValue;
  targetColumn: string;
  since: number;
  until: number;
}): Promise<{ activities: TwentyTimelineActivity[]; cursor: number }> {
  const filter = `${targetColumn}[is]:NOT_NULL,linkedRecordId[is]:NULL,updatedAt[gt]:${JSON.stringify(
    new Date(since).toISOString()
  )},updatedAt[lte]:${JSON.stringify(new Date(until).toISOString())}`;
  const { records } = await listRecords({
    auth,
    objectNamePlural: 'timelineActivities',
    orderBy: 'updatedAt[AscNullsLast]',
    filter,
    limit: 100,
  });

  const cursor = records.reduce(
    (newest, record) =>
      typeof record.updatedAt === 'string'
        ? Math.max(newest, dayjs(record.updatedAt).valueOf())
        : newest,
    since
  );
  const activities = records.flatMap((record): TwentyTimelineActivity[] => {
    const activity = twentyTimelineUtils.toTimelineActivity({
      record,
      targetColumn,
    });
    return activity ? [activity] : [];
  });

  return { activities, cursor };
}

async function getRecordsByIds({
  auth,
  objectNamePlural,
  recordIds,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  recordIds: string[];
}): Promise<TwentyRecord[]> {
  const pages = await Promise.all(
    chunk(recordIds, ID_BATCH_SIZE).map((batch) =>
      listAllRecords({
        auth,
        objectNamePlural,
        filter: idInFilter({ ids: batch }),
        limit: batch.length,
      })
    )
  );
  return pages.flat();
}

async function getRecord({
  auth,
  objectNamePlural,
  recordId,
  depth,
  fields,
}: RecordParams & {
  auth: TwentyAuthValue;
  depth?: number;
  fields?: string;
}): Promise<TwentyRecord | undefined> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.GET,
    path: recordsPath({ objectNamePlural, recordId }),
    query: compactQuery({ values: { depth, fields } }),
  });
  return firstValue({ envelope: response });
}

async function createRecord({
  auth,
  objectNamePlural,
  recordValues,
  upsert,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  recordValues: Record<string, unknown>;
  upsert?: boolean;
}): Promise<TwentyRecord | undefined> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.POST,
    path: recordsPath({ objectNamePlural }),
    query: compactQuery({ values: { upsert: upsert ? true : undefined } }),
    body: recordValues,
  });
  return firstValue({ envelope: response });
}

async function createRecords({
  auth,
  objectNamePlural,
  recordValuesList,
  upsert,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  recordValuesList: Record<string, unknown>[];
  upsert?: boolean;
}): Promise<{ records: TwentyRecord[]; count: number }> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord[]>>({
    auth,
    method: HttpMethod.POST,
    path: `/rest/batch/${encodeURIComponent(objectNamePlural)}`,
    query: compactQuery({ values: { upsert: upsert ? true : undefined } }),
    body: recordValuesList,
  });
  const created = firstValue({ envelope: response }) ?? [];
  return { records: created, count: created.length };
}

async function updateRecord({
  auth,
  objectNamePlural,
  recordId,
  recordValues,
  appendArrays,
}: RecordParams & {
  auth: TwentyAuthValue;
  recordValues: Record<string, unknown>;
  appendArrays?: boolean;
}): Promise<TwentyRecord | undefined> {
  const body = appendArrays
    ? appendArrayFields({
        recordValues,
        existing: await getRecord({ auth, objectNamePlural, recordId }),
      })
    : recordValues;
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.PATCH,
    path: recordsPath({ objectNamePlural, recordId }),
    body,
  });
  return firstValue({ envelope: response });
}

async function updateRecords({
  auth,
  objectNamePlural,
  conditions,
  recordValues,
  limit,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  conditions: QueryConditionNode[];
  recordValues: Record<string, unknown>;
  limit?: number;
}): Promise<TwentyRecord[]> {
  const filter = filterString({ conditions });
  if (filter === undefined)
    throw new Error(
      'Set at least one filter. To update every record on purpose, filter on Created At is NOT_NULL.'
    );

  return await mutateMatches({
    auth,
    objectNamePlural,
    filter,
    limit,
    mutate: async ({ filter: scopedFilter }) => {
      const response = await twentyClient.request<
        TwentyEnvelope<TwentyRecord[]>
      >({
        auth,
        method: HttpMethod.PATCH,
        path: recordsPath({ objectNamePlural }),
        query: { filter: scopedFilter },
        body: recordValues,
      });
      return firstValue({ envelope: response }) ?? [];
    },
  });
}

async function deleteRecords({
  auth,
  objectNamePlural,
  conditions,
  permanent,
  limit,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  conditions: QueryConditionNode[];
  permanent: boolean;
  limit?: number;
}): Promise<TwentyRecord[]> {
  const filter = filterString({ conditions });
  if (filter === undefined)
    throw new Error(
      'Set at least one filter. To delete every record on purpose, filter on Created At is NOT_NULL.'
    );

  return await mutateMatches({
    auth,
    objectNamePlural,
    filter,
    limit,
    mutate: async ({ filter: scopedFilter }) => {
      const response = await twentyClient.request<
        TwentyEnvelope<TwentyRecord[]>
      >({
        auth,
        method: HttpMethod.DELETE,
        path: recordsPath({ objectNamePlural }),
        query: permanent
          ? { filter: scopedFilter }
          : { filter: scopedFilter, soft_delete: 'true' },
      });
      return firstValue({ envelope: response }) ?? [];
    },
  });
}

async function deleteRecord({
  auth,
  objectNamePlural,
  recordId,
  permanent,
}: RecordParams & { auth: TwentyAuthValue; permanent?: boolean }): Promise<
  TwentyRecord | undefined
> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.DELETE,
    path: recordsPath({ objectNamePlural, recordId }),
    query: compactQuery({
      values: { soft_delete: permanent ? undefined : true },
    }),
  });
  return firstValue({ envelope: response });
}

async function restoreRecord({
  auth,
  objectNamePlural,
  recordId,
}: RecordParams & { auth: TwentyAuthValue }): Promise<
  TwentyRecord | undefined
> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.PATCH,
    path: `${recordsPath({ objectNamePlural, recordId })}/restore`,
  });
  return firstValue({ envelope: response });
}

async function findDuplicateRecords({
  auth,
  objectNamePlural,
  recordIds,
  recordValuesList,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  recordIds?: string[];
  recordValuesList?: Record<string, unknown>[];
}): Promise<{
  results: {
    duplicates: TwentyRecord[];
    totalCount?: number;
    pageInfo?: TwentyPageInfo;
  }[];
}> {
  const response = await twentyClient.request<{
    data: TwentyDuplicateConnection[];
  }>({
    auth,
    method: HttpMethod.POST,
    path: `${recordsPath({ objectNamePlural })}/duplicates`,
    body: { ids: recordIds, data: recordValuesList },
  });
  return {
    results: response.data.map((connection) => {
      const duplicates = Object.entries(connection).find(([key]) =>
        key.endsWith('Duplicates')
      )?.[1];
      return {
        duplicates: Array.isArray(duplicates) ? duplicates : [],
        totalCount: connection.totalCount,
        pageInfo: connection.pageInfo,
      };
    }),
  };
}

async function mergeRecords({
  auth,
  objectNamePlural,
  recordIds,
  conflictPriorityIndex,
  dryRun,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  recordIds: string[];
  conflictPriorityIndex: number;
  dryRun?: boolean;
}): Promise<TwentyRecord | undefined> {
  const response = await twentyClient.request<TwentyEnvelope<TwentyRecord>>({
    auth,
    method: HttpMethod.PATCH,
    path: `${recordsPath({ objectNamePlural })}/merge`,
    body: { ids: recordIds, conflictPriorityIndex, dryRun: dryRun ?? false },
  });
  return firstValue({ envelope: response });
}

async function groupRecords({
  auth,
  objectNamePlural,
  groupBy,
  aggregate,
  filter,
  orderBy,
  limit,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  groupBy: Record<string, unknown>[];
  aggregate?: string[];
  filter?: string;
  orderBy?: string;
  limit?: number;
}): Promise<{ groups: Record<string, unknown>[]; count: number }> {
  const groups = await twentyClient.request<Record<string, unknown>[]>({
    auth,
    method: HttpMethod.GET,
    path: `${recordsPath({ objectNamePlural })}/groupBy`,
    query: compactQuery({
      values: {
        group_by: JSON.stringify(groupBy),
        aggregate: aggregate ? JSON.stringify(aggregate) : undefined,
        filter,
        order_by: orderBy,
        limit,
      },
    }),
  });
  return { groups, count: groups.length };
}

async function listObjects({
  auth,
  limit,
  startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue }): Promise<
  MetadataList & { objects: TwentyMetadataItem[] }
> {
  const page = await listMetadata({
    auth,
    resource: 'objects',
    limit,
    startingAfter,
  });
  return {
    objects: page.items,
    pageInfo: page.pageInfo,
    totalCount: page.totalCount,
  };
}

async function getObject({
  auth,
  objectId,
}: {
  auth: TwentyAuthValue;
  objectId: string;
}): Promise<TwentyMetadataItem> {
  const response = await twentyClient.request<TwentyMetadataSingle>({
    auth,
    method: HttpMethod.GET,
    path: `/rest/metadata/objects/${encodeURIComponent(objectId)}`,
  });
  return response.data?.object ?? response;
}

async function listAllObjects({
  auth,
  startingAfter,
}: {
  auth: TwentyAuthValue;
  startingAfter?: string;
}): Promise<TwentyMetadataItem[]> {
  const page = await listObjects({ auth, limit: 200, startingAfter });
  const pageInfo = page.pageInfo;
  if (!pageInfo || !pageInfo.hasNextPage || !pageInfo.endCursor)
    return page.objects;
  return [
    ...page.objects,
    ...(await listAllObjects({ auth, startingAfter: pageInfo.endCursor })),
  ];
}

async function getObjectFields({
  auth,
  objectId,
}: {
  auth: TwentyAuthValue;
  objectId: string;
}): Promise<TwentyMetadataField[]> {
  const object = await getObject({ auth, objectId });
  const fields = object['fields'];
  return Array.isArray(fields) ? fields.filter(isMetadataField) : [];
}

async function getField({
  auth,
  fieldId,
}: {
  auth: TwentyAuthValue;
  fieldId: string;
}): Promise<TwentyMetadataField> {
  return await twentyClient.request<TwentyMetadataField>({
    auth,
    method: HttpMethod.GET,
    path: `/rest/metadata/fields/${encodeURIComponent(fieldId)}`,
  });
}

async function listFields({
  auth,
  limit,
  startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue }): Promise<
  MetadataList & { fields: TwentyMetadataItem[] }
> {
  const page = await listMetadata({
    auth,
    resource: 'fields',
    limit,
    startingAfter,
  });
  return {
    fields: page.items,
    pageInfo: page.pageInfo,
    totalCount: page.totalCount,
  };
}

async function getPerson({
  auth,
  personId,
}: {
  auth: TwentyAuthValue;
  personId: string;
}): Promise<TwentyPersonResponse> {
  return await twentyClient.request<TwentyPersonResponse>({
    auth,
    method: HttpMethod.GET,
    path: `/rest/people/${personId}`,
  });
}

async function mutateMatches({
  auth,
  objectNamePlural,
  filter,
  limit,
  mutate,
}: {
  auth: TwentyAuthValue;
  objectNamePlural: string;
  filter: string;
  limit: number | undefined;
  mutate: (params: { filter: string }) => Promise<TwentyRecord[]>;
}): Promise<TwentyRecord[]> {
  if (limit === undefined) return await mutate({ filter });

  const matches = await listAllRecords({
    auth,
    objectNamePlural,
    filter,
    limit,
  });
  const ids = matches.flatMap((record) => (record.id ? [record.id] : []));
  const mutated: TwentyRecord[] = [];
  for (const batch of chunk(ids, ID_BATCH_SIZE)) {
    mutated.push(
      ...(await mutate({ filter: `${idInFilter({ ids: batch })},${filter}` }))
    );
  }
  return mutated;
}

function idInFilter({ ids }: { ids: string[] }): string {
  return `id[in]:${JSON.stringify(ids)}`;
}

function filterString({
  conditions,
}: {
  conditions: QueryConditionNode[];
}): string | undefined {
  return filterQuery({ conditions })['filter'];
}

async function listMetadata({
  auth,
  resource,
  limit,
  startingAfter,
}: MetadataListParams & { auth: TwentyAuthValue; resource: string }): Promise<
  MetadataList & { items: TwentyMetadataItem[] }
> {
  const response = await twentyClient.request<TwentyMetadataPage>({
    auth,
    method: HttpMethod.GET,
    path: `/rest/metadata/${resource}`,
    query: compactQuery({ values: { limit, starting_after: startingAfter } }),
  });
  const items = Array.isArray(response.data)
    ? response.data
    : firstValue({ envelope: { data: response.data } }) ?? [];
  return {
    items,
    pageInfo: response.pageInfo,
    totalCount: response.totalCount,
  };
}

function firstValue<T>({
  envelope,
}: {
  envelope: TwentyEnvelope<T>;
}): T | undefined {
  return Object.values(envelope.data)[0];
}

function isMetadataField(value: unknown): value is TwentyMetadataField {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'name' in value &&
    typeof value.name === 'string' &&
    'type' in value &&
    typeof value.type === 'string'
  );
}

function recordsPath({
  objectNamePlural,
  recordId,
}: {
  objectNamePlural: string;
  recordId?: string;
}): string {
  const base = `/rest/${encodeURIComponent(objectNamePlural)}`;
  return recordId ? `${base}/${encodeURIComponent(recordId)}` : base;
}

function filterQuery({
  conditions,
}: {
  conditions: QueryConditionNode[];
}): QueryParams {
  const filter = conditions
    .flatMap((node) => pruneConditionNode({ node }))
    .map((node) => renderConditionNode({ node }))
    .join(',');
  return filter ? { filter } : {};
}

function pruneConditionNode({
  node,
}: {
  node: QueryConditionNode;
}): QueryConditionNode[] {
  if (!isConditionGroup(node))
    return isEmptyFieldValue({ value: node.value }) ? [] : [node];
  const conditions = node.conditions.flatMap((child) =>
    pruneConditionNode({ node: child })
  );
  if (conditions.length === 0) return [];
  if (conditions.length === 1 && node.conjunction !== 'not') return conditions;
  return [{ conjunction: node.conjunction, conditions }];
}

function renderConditionNode({ node }: { node: QueryConditionNode }): string {
  if (isConditionGroup(node))
    return `${node.conjunction}(${node.conditions
      .map((child) => renderConditionNode({ node: child }))
      .join(',')})`;
  const { field, operator, value } = node;
  if (operator === 'ilike' || operator === 'like') {
    return `${field}[${operator}]:"${value}"`;
  }

  return `${field}[${operator}]:${
    operator === 'is' ? value : JSON.stringify(value)
  }`;
}

function isConditionGroup(
  node: QueryConditionNode
): node is QueryConditionGroup {
  return 'conjunction' in node;
}

function isEmptyFieldValue({
  value,
}: {
  value: FieldValue | undefined;
}): boolean {
  return (
    value === undefined ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

function appendArrayFields({
  recordValues,
  existing,
}: {
  recordValues: Record<string, unknown>;
  existing: TwentyRecord | undefined;
}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(recordValues).map(([field, value]) => {
      const current = existing?.[field];
      return Array.isArray(value) && Array.isArray(current)
        ? [field, [...new Set([...current, ...value])]]
        : [field, value];
    })
  );
}

function compactQuery({
  values,
}: {
  values: Record<string, string | number | boolean | null | undefined>;
}): QueryParams {
  return Object.fromEntries(
    Object.entries(values)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== ''
      )
      .map(([key, value]) => [key, String(value)])
  );
}

export const twentyApi = {
  checkConnection,
  createPerson,
  createCompany,
  createOpportunity,
  findCompanies,
  findPeople,
  findRecords,
  listRecentCompanies,
  listRecentPeople,
  updateCompany,
  updatePerson,
  listRecords,
  listAllRecords,
  listTimelines,
  getRecordsByIds,
  getRecord,
  createRecord,
  createRecords,
  updateRecord,
  updateRecords,
  deleteRecord,
  deleteRecords,
  restoreRecord,
  findDuplicateRecords,
  mergeRecords,
  groupRecords,
  listObjects,
  getObject,
  listAllObjects,
  getObjectFields,
  getField,
  listFields,
};

const MAX_PAGE_SIZE = 200;

const ID_BATCH_SIZE = 100;

const RECENT_RECORDS = {
  orderBy: 'createdAt[DescNullsLast]',
  limit: 100,
};

type CreatePersonParams = {
  firstName: string;
  lastName?: string;
  email?: string;
};

type CompanyFields = {
  domainName?: string;
  address?: string;
  employees?: number;
};

type CreateOpportunityParams = {
  name: string;
  stage?: string;
  amount?: number;
  currency?: string;
  closeDate?: string;
  companyId?: string;
};

type RecordParams = { objectNamePlural: string; recordId: string };

type ListRecordsParams = {
  objectNamePlural: string;
  filter?: string;
  orderBy?: string;
  limit?: number;
  depth?: number;
  fields?: string;
  startingAfter?: string;
};

type MetadataListParams = { limit?: number; startingAfter?: string };

type MetadataList = { pageInfo?: TwentyPageInfo; totalCount?: number };
