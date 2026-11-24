import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { AppConnectionValueForAuthProperty } from '@activepieces/pieces-framework';

import { queryMetabaseApi } from './common';

import type { metabaseAuth } from './auth';

async function request<T>({
  auth,
  method,
  path,
  query,
  body,
}: RequestParams & { auth: MetabaseAuth }): Promise<T> {
  return await queryMetabaseApi(
    {
      endpoint: path,
      method,
      queryParams: query ? toQueryParams({ params: query }) : undefined,
      body,
    },
    auth
  );
}

function toQueryParams({
  params,
}: {
  params: Record<string, QueryValue>;
}): QueryParams {
  return Object.fromEntries(
    Object.entries(params).flatMap(([key, value]) =>
      value === undefined ? [] : [[key, String(value)]]
    )
  );
}

function assertQuerySucceeded({
  result,
}: {
  result: MetabaseQueryResult;
}): MetabaseQueryResult {
  if (result.status === 'failed' || result.error) {
    throw new Error(
      `Metabase query failed: ${result.error ?? 'unknown error'}`
    );
  }
  return result;
}

async function listCards({
  auth,
  filter,
  modelId,
}: {
  auth: MetabaseAuth;
  filter?: string;
  modelId?: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: 'card',
    query: { f: filter, model_id: modelId },
  });
}

async function getCard({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<MetabaseCard> {
  return await request<MetabaseCard>({
    auth,
    method: HttpMethod.GET,
    path: `card/${cardId}`,
  });
}

async function createCard({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<MetabaseCard> {
  return await request<MetabaseCard>({
    auth,
    method: HttpMethod.POST,
    path: 'card',
    body,
  });
}

async function updateCard({
  auth,
  cardId,
  body,
}: {
  auth: MetabaseAuth;
  cardId: number;
  body: Record<string, unknown>;
}): Promise<MetabaseCard> {
  return await request<MetabaseCard>({
    auth,
    method: HttpMethod.PUT,
    path: `card/${cardId}`,
    body,
  });
}

async function deleteCard({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `card/${cardId}`,
  });
}

async function runCardQuery({
  auth,
  cardId,
  parameters,
  ignoreCache,
}: {
  auth: MetabaseAuth;
  cardId: number;
  parameters: unknown[];
  ignoreCache: boolean;
}): Promise<MetabaseQueryResult> {
  const result = await request<MetabaseQueryResult>({
    auth,
    method: HttpMethod.POST,
    path: `card/${cardId}/query`,
    body: { parameters, ignore_cache: ignoreCache },
  });
  return assertQuerySucceeded({ result });
}

async function copyCard({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<MetabaseCard> {
  return await request<MetabaseCard>({
    auth,
    method: HttpMethod.POST,
    path: `card/${cardId}/copy`,
  });
}

async function listCardDashboards({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `card/${cardId}/dashboards`,
  });
}

async function getCardQueryMetadata({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `card/${cardId}/query_metadata`,
  });
}

async function listCardParameterValues({
  auth,
  cardId,
  parameterId,
}: {
  auth: MetabaseAuth;
  cardId: number;
  parameterId: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `card/${cardId}/params/${encodeURIComponent(parameterId)}/values`,
  });
}

async function searchCardParameterValues({
  auth,
  cardId,
  parameterId,
  query,
}: {
  auth: MetabaseAuth;
  cardId: number;
  parameterId: string;
  query: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `card/${cardId}/params/${encodeURIComponent(
      parameterId
    )}/search/${encodeURIComponent(query)}`,
  });
}

async function moveCards({
  auth,
  cardIds,
  collectionId,
  dashboardId,
}: {
  auth: MetabaseAuth;
  cardIds: number[];
  collectionId?: number;
  dashboardId?: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: 'cards/move',
    body: {
      card_ids: cardIds,
      collection_id: collectionId,
      dashboard_id: dashboardId,
    },
  });
}

async function createCardPublicLink({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<{ uuid: string }> {
  return await request<{ uuid: string }>({
    auth,
    method: HttpMethod.POST,
    path: `card/${cardId}/public_link`,
  });
}

async function deleteCardPublicLink({
  auth,
  cardId,
}: {
  auth: MetabaseAuth;
  cardId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `card/${cardId}/public_link`,
  });
}

async function listDashboards({
  auth,
  filter,
}: {
  auth: MetabaseAuth;
  filter?: string;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: 'dashboard',
    query: { f: filter },
  });
}

async function getDashboard({
  auth,
  dashboardId,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
}): Promise<MetabaseDashboard> {
  return await request<MetabaseDashboard>({
    auth,
    method: HttpMethod.GET,
    path: `dashboard/${dashboardId}`,
  });
}

async function createDashboard({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: 'dashboard',
    body,
  });
}

async function updateDashboard({
  auth,
  dashboardId,
  body,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `dashboard/${dashboardId}`,
    body,
  });
}

async function deleteDashboard({
  auth,
  dashboardId,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `dashboard/${dashboardId}`,
  });
}

async function copyDashboard({
  auth,
  dashboardId,
  body,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `dashboard/${dashboardId}/copy`,
    body,
  });
}

async function runDashboardCardQuery({
  auth,
  dashboardId,
  dashcardId,
  cardId,
  parameters,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
  dashcardId: number;
  cardId: number;
  parameters: unknown[];
}): Promise<MetabaseQueryResult> {
  const result = await request<MetabaseQueryResult>({
    auth,
    method: HttpMethod.POST,
    path: `dashboard/${dashboardId}/dashcard/${dashcardId}/card/${cardId}/query`,
    body: { parameters },
  });
  return assertQuerySucceeded({ result });
}

async function listDashboardParameterValues({
  auth,
  dashboardId,
  parameterId,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
  parameterId: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `dashboard/${dashboardId}/params/${encodeURIComponent(
      parameterId
    )}/values`,
  });
}

async function searchDashboardParameterValues({
  auth,
  dashboardId,
  parameterId,
  query,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
  parameterId: string;
  query: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `dashboard/${dashboardId}/params/${encodeURIComponent(
      parameterId
    )}/search/${encodeURIComponent(query)}`,
  });
}

async function createDashboardPublicLink({
  auth,
  dashboardId,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
}): Promise<{ uuid: string }> {
  return await request<{ uuid: string }>({
    auth,
    method: HttpMethod.POST,
    path: `dashboard/${dashboardId}/public_link`,
  });
}

async function deleteDashboardPublicLink({
  auth,
  dashboardId,
}: {
  auth: MetabaseAuth;
  dashboardId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `dashboard/${dashboardId}/public_link`,
  });
}

async function listCollections({
  auth,
  archived,
  personalOnly,
}: {
  auth: MetabaseAuth;
  archived?: boolean;
  personalOnly?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: 'collection',
    query: { archived, 'personal-only': personalOnly },
  });
}

async function getCollection({
  auth,
  collectionId,
}: {
  auth: MetabaseAuth;
  collectionId: CollectionRef;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `collection/${collectionId}`,
  });
}

async function listCollectionItems({
  auth,
  collectionId,
  models,
  archived,
  limit,
  offset,
}: {
  auth: MetabaseAuth;
  collectionId: CollectionRef;
  models?: string;
  archived?: boolean;
  limit: number;
  offset?: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `collection/${collectionId}/items`,
    query: { models, archived, limit, offset },
  });
}

async function getCollectionTree({
  auth,
  excludeArchived,
}: {
  auth: MetabaseAuth;
  excludeArchived?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: 'collection/tree',
    query: { 'exclude-archived': excludeArchived },
  });
}

async function createCollection({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: 'collection',
    body,
  });
}

async function updateCollection({
  auth,
  collectionId,
  body,
}: {
  auth: MetabaseAuth;
  collectionId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `collection/${collectionId}`,
    body,
  });
}

async function deleteCollection({
  auth,
  collectionId,
}: {
  auth: MetabaseAuth;
  collectionId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `collection/${collectionId}`,
  });
}

async function runQuery({
  auth,
  datasetQuery,
}: {
  auth: MetabaseAuth;
  datasetQuery: Record<string, unknown>;
}): Promise<MetabaseQueryResult> {
  const result = await request<MetabaseQueryResult>({
    auth,
    method: HttpMethod.POST,
    path: 'dataset',
    body: datasetQuery,
  });
  return assertQuerySucceeded({ result });
}

async function convertQueryToNative({
  auth,
  datasetQuery,
}: {
  auth: MetabaseAuth;
  datasetQuery: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: 'dataset/native',
    body: datasetQuery,
  });
}

async function search({
  auth,
  q,
  models,
  collectionId,
  archived,
  limit,
  offset,
}: {
  auth: MetabaseAuth;
  q?: string;
  models?: string;
  collectionId?: number;
  archived?: boolean;
  limit: number;
  offset?: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: 'search',
    query: { q, models, collection: collectionId, archived, limit, offset },
  });
}

async function listDatabases({
  auth,
  include,
}: {
  auth: MetabaseAuth;
  include?: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `database`,
    query: { include: include },
  });
}

async function getDatabase({
  auth,
  databaseId,
  include,
}: {
  auth: MetabaseAuth;
  databaseId: number;
  include?: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}`,
    query: { include: include },
  });
}

async function getDatabaseMetadata({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}/metadata`,
  });
}

async function updateDatabase({
  auth,
  databaseId,
  body,
}: {
  auth: MetabaseAuth;
  databaseId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `database/${databaseId}`,
    body,
  });
}

async function listDatabaseSchemas({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}/schemas`,
  });
}

async function listSchemaTables({
  auth,
  databaseId,
  schema,
}: {
  auth: MetabaseAuth;
  databaseId: number;
  schema: string;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}/schema/${schema}`,
  });
}

async function listDatabaseFields({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}/fields`,
  });
}

async function checkDatabaseHealth({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `database/${databaseId}/healthcheck`,
  });
}

async function syncDatabaseSchema({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `database/${databaseId}/sync_schema`,
  });
}

async function rescanDatabaseFieldValues({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `database/${databaseId}/rescan_values`,
  });
}

async function discardDatabaseFieldValues({
  auth,
  databaseId,
}: {
  auth: MetabaseAuth;
  databaseId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `database/${databaseId}/discard_values`,
  });
}

async function listTables({
  auth,
  term,
}: {
  auth: MetabaseAuth;
  term?: string;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `table`,
    query: { term: term },
  });
}

async function getTable({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `table/${tableId}`,
  });
}

async function getTableMetadata({
  auth,
  tableId,
  includeHiddenFields,
  includeSensitiveFields,
}: {
  auth: MetabaseAuth;
  tableId: number;
  includeHiddenFields?: boolean;
  includeSensitiveFields?: boolean;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `table/${tableId}/query_metadata`,
    query: {
      include_hidden_fields: includeHiddenFields,
      include_sensitive_fields: includeSensitiveFields,
    },
  });
}

async function listTableForeignKeys({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `table/${tableId}/fks`,
  });
}

async function getTableData({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<MetabaseQueryResult> {
  return await request<MetabaseQueryResult>({
    auth,
    method: HttpMethod.GET,
    path: `table/${tableId}/data`,
  });
}

async function updateTable({
  auth,
  tableId,
  body,
}: {
  auth: MetabaseAuth;
  tableId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `table/${tableId}`,
    body,
  });
}

async function syncTableSchema({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `table/${tableId}/sync_schema`,
  });
}

async function rescanTableFieldValues({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `table/${tableId}/rescan_values`,
  });
}

async function discardTableFieldValues({
  auth,
  tableId,
}: {
  auth: MetabaseAuth;
  tableId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `table/${tableId}/discard_values`,
  });
}

async function getField({
  auth,
  fieldId,
}: {
  auth: MetabaseAuth;
  fieldId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `field/${fieldId}`,
  });
}

async function updateField({
  auth,
  fieldId,
  body,
}: {
  auth: MetabaseAuth;
  fieldId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `field/${fieldId}`,
    body,
  });
}

async function listFieldValues({
  auth,
  fieldId,
}: {
  auth: MetabaseAuth;
  fieldId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `field/${fieldId}/values`,
  });
}

async function updateFieldValues({
  auth,
  fieldId,
  body,
}: {
  auth: MetabaseAuth;
  fieldId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `field/${fieldId}/values`,
    body,
  });
}

async function searchFieldValues({
  auth,
  fieldId,
  searchFieldId,
  value,
}: {
  auth: MetabaseAuth;
  fieldId: number;
  searchFieldId: number;
  value?: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `field/${fieldId}/search/${searchFieldId}`,
    query: { value: value },
  });
}

async function getFieldSummary({
  auth,
  fieldId,
}: {
  auth: MetabaseAuth;
  fieldId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `field/${fieldId}/summary`,
  });
}

async function rescanFieldValues({
  auth,
  fieldId,
}: {
  auth: MetabaseAuth;
  fieldId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `field/${fieldId}/rescan_values`,
  });
}

async function discardFieldValues({
  auth,
  fieldId,
}: {
  auth: MetabaseAuth;
  fieldId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `field/${fieldId}/discard_values`,
  });
}

async function getCurrentUser({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `user/current`,
  });
}

async function listUsers({
  auth,
  query,
  groupId,
  includeDeactivated,
  limit,
  offset,
}: {
  auth: MetabaseAuth;
  query?: string;
  groupId?: number;
  includeDeactivated?: boolean;
  limit?: number;
  offset?: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `user`,
    query: {
      query: query,
      group_id: groupId,
      include_deactivated: includeDeactivated,
      limit: limit,
      offset: offset,
    },
  });
}

async function getUser({
  auth,
  userId,
}: {
  auth: MetabaseAuth;
  userId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `user/${userId}`,
  });
}

async function createUser({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `user`,
    body,
  });
}

async function updateUser({
  auth,
  userId,
  body,
}: {
  auth: MetabaseAuth;
  userId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `user/${userId}`,
    body,
  });
}

async function deactivateUser({
  auth,
  userId,
}: {
  auth: MetabaseAuth;
  userId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `user/${userId}`,
  });
}

async function reactivateUser({
  auth,
  userId,
}: {
  auth: MetabaseAuth;
  userId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `user/${userId}/reactivate`,
  });
}

async function listGroups({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<MetabaseGroup[]> {
  return await request<MetabaseGroup[]>({
    auth,
    method: HttpMethod.GET,
    path: `permissions/group`,
  });
}

async function getGroup({
  auth,
  groupId,
}: {
  auth: MetabaseAuth;
  groupId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `permissions/group/${groupId}`,
  });
}

async function createGroup({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `permissions/group`,
    body,
  });
}

async function deleteGroup({
  auth,
  groupId,
}: {
  auth: MetabaseAuth;
  groupId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `permissions/group/${groupId}`,
  });
}

async function addGroupMember({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `permissions/membership`,
    body,
  });
}

async function removeGroupMember({
  auth,
  membershipId,
}: {
  auth: MetabaseAuth;
  membershipId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `permissions/membership/${membershipId}`,
  });
}

async function listAlerts({
  auth,
  payloadType,
  cardId,
  creatorId,
  includeInactive,
}: {
  auth: MetabaseAuth;
  payloadType?: string;
  cardId?: number;
  creatorId?: number;
  includeInactive?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `notification`,
    query: {
      payload_type: payloadType,
      card_id: cardId,
      creator_id: creatorId,
      include_inactive: includeInactive,
    },
  });
}

async function getAlert({
  auth,
  alertId,
}: {
  auth: MetabaseAuth;
  alertId: number;
}): Promise<MetabaseNotification> {
  return await request<MetabaseNotification>({
    auth,
    method: HttpMethod.GET,
    path: `notification/${alertId}`,
  });
}

async function createAlert({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `notification`,
    body,
  });
}

async function updateAlert({
  auth,
  alertId,
  body,
}: {
  auth: MetabaseAuth;
  alertId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `notification/${alertId}`,
    body,
  });
}

async function sendAlert({
  auth,
  alertId,
  body,
}: {
  auth: MetabaseAuth;
  alertId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `notification/${alertId}/send`,
    body,
  });
}

async function listDashboardSubscriptions({
  auth,
  dashboardId,
  archived,
}: {
  auth: MetabaseAuth;
  dashboardId?: number;
  archived?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `pulse`,
    query: { dashboard_id: dashboardId, archived: archived },
  });
}

async function getDashboardSubscription({
  auth,
  subscriptionId,
}: {
  auth: MetabaseAuth;
  subscriptionId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `pulse/${subscriptionId}`,
  });
}

async function createDashboardSubscription({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `pulse`,
    body,
  });
}

async function updateDashboardSubscription({
  auth,
  subscriptionId,
  body,
}: {
  auth: MetabaseAuth;
  subscriptionId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `pulse/${subscriptionId}`,
    body,
  });
}

async function listTimelines({
  auth,
  include,
  archived,
}: {
  auth: MetabaseAuth;
  include?: string;
  archived?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `timeline`,
    query: { include: include, archived: archived },
  });
}

async function getTimeline({
  auth,
  timelineId,
  include,
  archived,
}: {
  auth: MetabaseAuth;
  timelineId: number;
  include?: string;
  archived?: boolean;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `timeline/${timelineId}`,
    query: { include: include, archived: archived },
  });
}

async function createTimeline({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `timeline`,
    body,
  });
}

async function updateTimeline({
  auth,
  timelineId,
  body,
}: {
  auth: MetabaseAuth;
  timelineId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `timeline/${timelineId}`,
    body,
  });
}

async function deleteTimeline({
  auth,
  timelineId,
}: {
  auth: MetabaseAuth;
  timelineId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `timeline/${timelineId}`,
  });
}

async function listCollectionTimelines({
  auth,
  collectionId,
  include,
  archived,
}: {
  auth: MetabaseAuth;
  collectionId: CollectionRef;
  include?: string;
  archived?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `timeline/collection/${collectionId}`,
    query: { include: include, archived: archived },
  });
}

async function createTimelineEvent({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `timeline-event`,
    body,
  });
}

async function getTimelineEvent({
  auth,
  eventId,
}: {
  auth: MetabaseAuth;
  eventId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `timeline-event/${eventId}`,
  });
}

async function updateTimelineEvent({
  auth,
  eventId,
  body,
}: {
  auth: MetabaseAuth;
  eventId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `timeline-event/${eventId}`,
    body,
  });
}

async function deleteTimelineEvent({
  auth,
  eventId,
}: {
  auth: MetabaseAuth;
  eventId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `timeline-event/${eventId}`,
  });
}

async function listSnippets({
  auth,
  archived,
}: {
  auth: MetabaseAuth;
  archived?: boolean;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `native-query-snippet`,
    query: { archived: archived },
  });
}

async function getSnippet({
  auth,
  snippetId,
}: {
  auth: MetabaseAuth;
  snippetId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `native-query-snippet/${snippetId}`,
  });
}

async function createSnippet({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `native-query-snippet`,
    body,
  });
}

async function updateSnippet({
  auth,
  snippetId,
  body,
}: {
  auth: MetabaseAuth;
  snippetId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `native-query-snippet/${snippetId}`,
    body,
  });
}

async function listSegments({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `segment`,
  });
}

async function getSegment({
  auth,
  segmentId,
}: {
  auth: MetabaseAuth;
  segmentId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `segment/${segmentId}`,
  });
}

async function createSegment({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `segment`,
    body,
  });
}

async function updateSegment({
  auth,
  segmentId,
  body,
}: {
  auth: MetabaseAuth;
  segmentId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `segment/${segmentId}`,
    body,
  });
}

async function deleteSegment({
  auth,
  segmentId,
  revisionMessage,
}: {
  auth: MetabaseAuth;
  segmentId: number;
  revisionMessage?: string;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `segment/${segmentId}`,
    query: { revision_message: revisionMessage },
  });
}

async function listGlossaryEntries({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `glossary`,
  });
}

async function createGlossaryEntry({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `glossary`,
    body,
  });
}

async function updateGlossaryEntry({
  auth,
  glossaryId,
  body,
}: {
  auth: MetabaseAuth;
  glossaryId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `glossary/${glossaryId}`,
    body,
  });
}

async function deleteGlossaryEntry({
  auth,
  glossaryId,
}: {
  auth: MetabaseAuth;
  glossaryId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `glossary/${glossaryId}`,
  });
}

async function listDocuments({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `document`,
  });
}

async function getDocument({
  auth,
  documentId,
}: {
  auth: MetabaseAuth;
  documentId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `document/${documentId}`,
  });
}

async function createDocument({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `document`,
    body,
  });
}

async function updateDocument({
  auth,
  documentId,
  body,
}: {
  auth: MetabaseAuth;
  documentId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `document/${documentId}`,
    body,
  });
}

async function deleteDocument({
  auth,
  documentId,
}: {
  auth: MetabaseAuth;
  documentId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `document/${documentId}`,
  });
}

async function listBookmarks({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `bookmark`,
  });
}

async function createBookmark({
  auth,
  model,
  itemId,
}: {
  auth: MetabaseAuth;
  model: string;
  itemId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `bookmark/${model}/${itemId}`,
  });
}

async function deleteBookmark({
  auth,
  model,
  itemId,
}: {
  auth: MetabaseAuth;
  model: string;
  itemId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `bookmark/${model}/${itemId}`,
  });
}

async function listRevisions({
  auth,
  entity,
  entityId,
}: {
  auth: MetabaseAuth;
  entity?: string;
  entityId?: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `revision`,
    query: { entity: entity, id: entityId },
  });
}

async function revertRevision({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `revision/revert`,
    body,
  });
}

async function listPopularItems({
  auth,
}: {
  auth: MetabaseAuth;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `activity/popular_items`,
  });
}

async function listRecentViews({
  auth,
  context,
}: {
  auth: MetabaseAuth;
  context?: string;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `activity/recents`,
    query: { context: context },
  });
}

async function listActions({
  auth,
  modelId,
}: {
  auth: MetabaseAuth;
  modelId?: number;
}): Promise<unknown[]> {
  return await request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: `action`,
    query: { 'model-id': modelId },
  });
}

async function getAction({
  auth,
  actionId,
}: {
  auth: MetabaseAuth;
  actionId: number;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: `action/${actionId}`,
  });
}

async function createAction({
  auth,
  body,
}: {
  auth: MetabaseAuth;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `action`,
    body,
  });
}

async function updateAction({
  auth,
  actionId,
  body,
}: {
  auth: MetabaseAuth;
  actionId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `action/${actionId}`,
    body,
  });
}

async function deleteAction({
  auth,
  actionId,
}: {
  auth: MetabaseAuth;
  actionId: number;
}): Promise<void> {
  await request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `action/${actionId}`,
  });
}

async function executeAction({
  auth,
  actionId,
  body,
}: {
  auth: MetabaseAuth;
  actionId: number;
  body: Record<string, unknown>;
}): Promise<unknown> {
  return await request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `action/${actionId}/execute`,
    body,
  });
}

export const metabaseApi = {
  listCards,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  runCardQuery,
  copyCard,
  listCardDashboards,
  getCardQueryMetadata,
  listCardParameterValues,
  searchCardParameterValues,
  moveCards,
  createCardPublicLink,
  deleteCardPublicLink,
  listDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  copyDashboard,
  runDashboardCardQuery,
  listDashboardParameterValues,
  searchDashboardParameterValues,
  createDashboardPublicLink,
  deleteDashboardPublicLink,
  listCollections,
  getCollection,
  listCollectionItems,
  getCollectionTree,
  createCollection,
  updateCollection,
  deleteCollection,
  runQuery,
  convertQueryToNative,
  search,
  listDatabases,
  getDatabase,
  getDatabaseMetadata,
  updateDatabase,
  listDatabaseSchemas,
  listSchemaTables,
  listDatabaseFields,
  checkDatabaseHealth,
  syncDatabaseSchema,
  rescanDatabaseFieldValues,
  discardDatabaseFieldValues,
  listTables,
  getTable,
  getTableMetadata,
  listTableForeignKeys,
  getTableData,
  updateTable,
  syncTableSchema,
  rescanTableFieldValues,
  discardTableFieldValues,
  getField,
  updateField,
  listFieldValues,
  updateFieldValues,
  searchFieldValues,
  getFieldSummary,
  rescanFieldValues,
  discardFieldValues,
  getCurrentUser,
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  reactivateUser,
  listGroups,
  getGroup,
  createGroup,
  deleteGroup,
  addGroupMember,
  removeGroupMember,
  listAlerts,
  getAlert,
  createAlert,
  updateAlert,
  sendAlert,
  listDashboardSubscriptions,
  getDashboardSubscription,
  createDashboardSubscription,
  updateDashboardSubscription,
  listTimelines,
  getTimeline,
  createTimeline,
  updateTimeline,
  deleteTimeline,
  listCollectionTimelines,
  createTimelineEvent,
  getTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  listSnippets,
  getSnippet,
  createSnippet,
  updateSnippet,
  listSegments,
  getSegment,
  createSegment,
  updateSegment,
  deleteSegment,
  listGlossaryEntries,
  createGlossaryEntry,
  updateGlossaryEntry,
  deleteGlossaryEntry,
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  listBookmarks,
  createBookmark,
  deleteBookmark,
  listRevisions,
  revertRevision,
  listPopularItems,
  listRecentViews,
  listActions,
  getAction,
  createAction,
  updateAction,
  deleteAction,
  executeAction,
};

type QueryValue = string | number | boolean | undefined;

type CollectionRef = number | 'root';

type RequestParams = {
  method: HttpMethod;
  path: string;
  query?: Record<string, QueryValue>;
  body?: object;
};

export type MetabaseAuth = AppConnectionValueForAuthProperty<
  typeof metabaseAuth
>;

export type MetabaseParameter = {
  id: string;
  slug: string;
  name?: string;
  type?: string;
  target?: unknown;
};

export type MetabaseCard = {
  id: number;
  name?: string;
  parameters?: MetabaseParameter[];
};

export type MetabaseDashboard = {
  id: number;
  name?: string;
  parameters?: MetabaseParameter[];
  dashcards?: { id: number; card_id?: number | null }[];
};

export type MetabaseGroup = {
  id: number;
  name?: string;
  magic_group_type?: string | null;
};

export type MetabaseNotification = {
  id: number;
  active?: boolean;
  payload?: Record<string, unknown>;
  subscriptions?: Record<string, unknown>[];
};

export type MetabaseQueryResult = {
  status?: string;
  error?: string;
};
