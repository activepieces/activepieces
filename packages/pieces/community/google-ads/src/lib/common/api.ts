import { HttpMethod } from '@activepieces/pieces-common';

import { googleAdsClient } from './client';
import type {
  GoogleAdsAuthValue,
  GoogleAdsCustomerInfo,
  GoogleAdsCustomerMatchRequest,
  GoogleAdsCustomerMatchResult,
  GoogleAdsDestination,
  GoogleAdsFieldWarning,
  GoogleAdsIngestResponse,
  GoogleAdsMutateResponse,
  GoogleAdsRecordMutationResult,
  GoogleAdsRecordOperation,
  GoogleAdsRequestStatusPerDestination,
  GoogleAdsRequestStatusResponse,
  GoogleAdsResourceDefinition,
  GoogleAdsRow,
  GoogleAdsSearchAllResult,
  GoogleAdsSearchPage,
  GoogleAdsUploadParams,
} from './types';
import { googleAdsUtils } from './utils';

async function listAccessibleCustomers({ auth }: { auth: GoogleAdsAuthValue }): Promise<string[]> {
  const body = await googleAdsClient.request<{ resourceNames?: string[] }>({ auth, method: HttpMethod.GET, path: '/customers:listAccessibleCustomers' });
  return (body.resourceNames ?? []).map((name) => name.replace(/^customers\//, ''));
}

async function search({ auth, customerId, query, pageToken }: SearchParams & { auth: GoogleAdsAuthValue }): Promise<GoogleAdsSearchPage> {
  return await googleAdsClient.request<GoogleAdsSearchPage>({
    auth,
    method: HttpMethod.POST,
    path: `/customers/${googleAdsUtils.normalizeCustomerId(customerId)}/googleAds:search`,
    body: { query: googleAdsUtils.assertGaql(query), ...(pageToken ? { pageToken } : {}) },
  });
}

async function searchAll({ auth, customerId, query, maxRows }: SearchParams & { auth: GoogleAdsAuthValue; maxRows: number }): Promise<GoogleAdsSearchAllResult> {
  const limit = Math.max(Math.floor(maxRows), 1);
  const results: GoogleAdsRow[] = [];
  let pageToken: string | undefined;
  do {
    const page = await search({ auth, customerId, query, pageToken });
    const rows = page.results ?? [];
    const room = limit - results.length;
    results.push(...rows.slice(0, room));
    pageToken = page.nextPageToken || undefined;
    if (results.length >= limit) {
      return { results, truncated: rows.length > room || pageToken !== undefined };
    }
  } while (pageToken);
  return { results, truncated: false };
}

async function mutateRecord({ auth, customerId, def, operation, validateOnly }: MutateRecordParams & { auth: GoogleAdsAuthValue }): Promise<GoogleAdsRecordMutationResult> {
  const normalizedCustomerId = googleAdsUtils.normalizeCustomerId(customerId);
  const response = await googleAdsClient.request<GoogleAdsMutateResponse>({
    auth,
    method: HttpMethod.POST,
    path: `/customers/${normalizedCustomerId}/googleAds:mutate`,
    body: {
      mutateOperations: [googleAdsUtils.buildOperation({ def, operation })],
      validateOnly,
      responseContentType: 'MUTABLE_RESOURCE',
    },
  });
  const { resourceName, ...rest } = response.mutateOperationResponses?.[0]?.[def.resultKey] ?? {};
  const returned = Object.keys(rest).length > 0 ? rest : null;
  const record =
    returned === null && resourceName && !validateOnly && !('remove' in operation)
      ? await findRecord({ auth, customerId: normalizedCustomerId, query: googleAdsUtils.recordByResourceNameQuery({ def, resourceName }) })
      : returned;
  return {
    resourceType: def.type,
    resourceName: resourceName ?? null,
    id: googleAdsUtils.idFromResourceName(resourceName),
    record,
    validateOnly,
  };
}

async function listCustomerClients({ auth, managerId }: { auth: GoogleAdsAuthValue; managerId: string }): Promise<{ clients: GoogleAdsCustomerInfo[]; truncated: boolean }> {
  const { results, truncated } = await searchAll({
    auth,
    customerId: managerId,
    query:
      "SELECT customer_client.id, customer_client.descriptive_name, customer_client.manager, customer_client.test_account, customer_client.level, customer_client.status FROM customer_client ORDER BY customer_client.level, customer_client.descriptive_name",
    maxRows: MAX_CUSTOMER_CLIENTS,
  });
  return { clients: results.map((row) => ({ ...row.customerClient, id: String(row.customerClient?.id ?? '') })), truncated };
}

async function getCustomerInfo({ auth, customerId }: { auth: GoogleAdsAuthValue; customerId: string }): Promise<GoogleAdsCustomerInfo> {
  const page = await search({
    auth,
    customerId,
    query: 'SELECT customer.id, customer.descriptive_name, customer.manager, customer.test_account FROM customer LIMIT 1',
  });
  return { ...page.results?.[0]?.customer, id: customerId };
}

async function listContactInfoUserLists({ auth, customerId }: { auth: GoogleAdsAuthValue; customerId: string }): Promise<GoogleAdsSearchAllResult> {
  return await searchAll({
    auth,
    customerId,
    query:
      "SELECT user_list.resource_name, user_list.id, user_list.name FROM user_list WHERE user_list.type = 'CRM_BASED' AND user_list.crm_based_user_list.upload_key_type = 'CONTACT_INFO' ORDER BY user_list.name",
    maxRows: MAX_USER_LISTS,
  });
}

async function listNewestRecords({ auth, customerId, def, limit }: { auth: GoogleAdsAuthValue; customerId: string; def: GoogleAdsResourceDefinition; limit: number }): Promise<GoogleAdsRow[]> {
  const page = await search({ auth, customerId, query: googleAdsUtils.newestRecordsQuery({ def, limit }) });
  return page.results ?? [];
}

async function listRecordsAfterId({ auth, customerId, def, afterId }: { auth: GoogleAdsAuthValue; customerId: string; def: GoogleAdsResourceDefinition; afterId: string }): Promise<GoogleAdsRow[]> {
  const { results } = await searchAll({ auth, customerId, query: googleAdsUtils.recordsAfterIdQuery({ def, afterId }), maxRows: MAX_ROWS_PER_POLL });
  return results;
}

async function listRecordsByResourceNames({ auth, customerId, def, resourceNames }: { auth: GoogleAdsAuthValue; customerId: string; def: GoogleAdsResourceDefinition; resourceNames: string[] }): Promise<GoogleAdsRow[]> {
  const rows: GoogleAdsRow[] = [];
  for (let start = 0; start < resourceNames.length; start += NAMES_PER_QUERY) {
    const chunk = resourceNames.slice(start, start + NAMES_PER_QUERY);
    const { results } = await searchAll({ auth, customerId, query: googleAdsUtils.recordsByResourceNamesQuery({ def, resourceNames: chunk }), maxRows: chunk.length });
    rows.push(...results);
  }
  return rows;
}

async function listCreateEvents({ auth, customerId, changeEventType, after, until, order, limit }: ListCreateEventsParams & { auth: GoogleAdsAuthValue }): Promise<GoogleAdsRow[]> {
  if (!/^[A-Z_]+$/.test(changeEventType) || !TIMESTAMP.test(after) || !TIMESTAMP.test(until)) {
    throw new Error(`Invalid change event query (${changeEventType}, ${after}, ${until}).`);
  }
  const { results } = await searchAll({
    auth,
    customerId,
    query: [
      'SELECT change_event.resource_name, change_event.change_date_time, change_event.change_resource_name FROM change_event',
      `WHERE change_event.change_date_time > '${after}' AND change_event.change_date_time <= '${until}'`,
      `AND change_event.change_resource_type = '${changeEventType}' AND change_event.resource_change_operation = 'CREATE'`,
      `ORDER BY change_event.change_date_time ${order} LIMIT ${limit}`,
    ].join(' '),
    maxRows: limit,
  });
  return results;
}

async function uploadCustomerMatch({ auth, ...params }: GoogleAdsUploadParams & { auth: GoogleAdsAuthValue }): Promise<GoogleAdsCustomerMatchResult> {
  const { batches, identifiers } = googleAdsUtils.buildMemberBatches({ members: params.members, limit: MEMBERS_PER_REQUEST });
  const userListId = googleAdsUtils.userListIdFrom({ userList: params.userList, customerId: params.customerId });
  await assertContactInfoList({ auth, customerId: params.customerId, userListId });
  const loginCustomerId = auth.props?.loginCustomerId?.trim();
  const destination: GoogleAdsDestination = {
    operatingAccount: { accountType: 'GOOGLE_ADS', accountId: googleAdsUtils.normalizeCustomerId(params.customerId) },
    ...(loginCustomerId ? { loginAccount: { accountType: 'GOOGLE_ADS', accountId: googleAdsUtils.normalizeCustomerId(loginCustomerId) } } : {}),
    productDestinationId: userListId,
  };

  const requestIds: string[] = [];
  const fieldWarnings: GoogleAdsFieldWarning[] = [];
  for (const [index, audienceMembers] of batches.entries()) {
    try {
      const answer = await googleAdsClient.dataManagerRequest<GoogleAdsIngestResponse>({
        auth,
        method: HttpMethod.POST,
        path: params.mode === 'add' ? '/audienceMembers:ingest' : '/audienceMembers:remove',
        body: {
          destinations: [destination],
          audienceMembers,
          encoding: 'HEX',
          ...(params.mode === 'add'
            ? {
                consent: { adUserData: CONSENT[params.consent.adUserData], adPersonalization: CONSENT[params.consent.adPersonalization] },
                termsOfService: { customerMatchTermsOfServiceStatus: 'ACCEPTED' },
              }
            : {}),
        },
      });
      if (!answer.requestId) {
        throw new Error('Google accepted the request but did not return a request id, so its processing cannot be tracked; the change may have been applied. Check the audience list before retrying.');
      }
      requestIds.push(answer.requestId);
      fieldWarnings.push(...(answer.fieldWarnings ?? []));
    } catch (error) {
      if (requestIds.length === 0) throw error;
      const reason = (error instanceof Error ? error.message : String(error)).replace(/\.$/, '');
      throw new Error(
        `Batch ${index + 1} of ${batches.length} failed: ${reason}. Google already accepted requests ${requestIds.join(', ')} for the earlier batches; ${STATUS_CHECK_HINT} before retrying, since a retry sends those batches again.`
      );
    }
  }

  const statuses = params.waitForCompletion ? await waitForRequests({ auth, requestIds }) : requestIds.map(() => []);
  const destinations = statuses.flat();
  const requests: GoogleAdsCustomerMatchRequest[] = requestIds.map((requestId, index) => {
    const matchRateRange = (statuses[index] ?? []).map((d) => d.audienceMembersIngestionStatus?.userDataIngestionStatus?.uploadMatchRateRange).find(Boolean);
    return { requestId, status: statusOf(statuses[index] ?? []), ...(matchRateRange ? { matchRateRange } : {}) };
  });
  return {
    requestIds,
    userList: params.userList,
    userListId,
    mode: params.mode,
    members: params.members.length,
    identifiers,
    status: aggregateStatus(requests.map((request) => request.status)),
    requests,
    errors: destinations.flatMap((d) => d.errorInfo?.errorCounts ?? []),
    warnings: destinations.flatMap((d) => d.warningInfo?.warningCounts ?? []),
    fieldWarnings,
  };
}

async function findRecord({ auth, customerId, query }: { auth: GoogleAdsAuthValue; customerId: string; query: string }): Promise<GoogleAdsRow | null> {
  try {
    const page = await search({ auth, customerId, query });
    return page.results?.[0] ?? null;
  } catch {
    return null;
  }
}

async function assertContactInfoList({ auth, customerId, userListId }: { auth: GoogleAdsAuthValue; customerId: string; userListId: string }): Promise<void> {
  const resourceName = `customers/${googleAdsUtils.normalizeCustomerId(customerId)}/userLists/${userListId}`;
  const page = await search({
    auth,
    customerId,
    query: `SELECT user_list.resource_name, user_list.type, user_list.crm_based_user_list.upload_key_type FROM user_list WHERE user_list.resource_name = '${resourceName}' LIMIT 1`,
  });
  const list = page.results?.[0]?.userList;
  if (list === undefined) {
    throw new Error(`Audience list ${resourceName} was not found. Pick a list from the dropdown or check the id and the selected customer; nothing was sent.`);
  }
  if (list.type !== 'CRM_BASED') {
    throw new Error(`Audience list ${resourceName} is a ${list.type ?? 'UNKNOWN'} list. Customer Match uploads need a CRM-based list whose upload key type is CONTACT_INFO; nothing was sent.`);
  }
  const uploadKeyType = list.crmBasedUserList?.uploadKeyType;
  if (uploadKeyType !== 'CONTACT_INFO') {
    throw new Error(
      `Audience list ${resourceName} expects ${uploadKeyType ?? 'UNKNOWN'} identifiers, but this action only sends contact information (e-mail, phone, address). Pick a CRM-based list whose upload key type is CONTACT_INFO; nothing was sent.`
    );
  }
}

async function waitForRequests({ auth, requestIds }: { auth: GoogleAdsAuthValue; requestIds: string[] }): Promise<GoogleAdsRequestStatusPerDestination[][]> {
  try {
    let statuses: GoogleAdsRequestStatusPerDestination[][] = requestIds.map(() => []);
    for (let attempt = 0; attempt < STATUS_POLLS; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, STATUS_POLL_INTERVAL_MS));
      statuses = await Promise.all(
        requestIds.map(async (requestId) => {
          const answer = await googleAdsClient.dataManagerRequest<GoogleAdsRequestStatusResponse>({
            auth,
            method: HttpMethod.GET,
            path: `/requestStatus:retrieve?${new URLSearchParams({ requestId }).toString()}`,
          });
          return answer.requestStatusPerDestination ?? [];
        })
      );
      if (statuses.every((destinations) => FINAL_STATUSES.has(statusOf(destinations)))) {
        break;
      }
    }
    return statuses;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Google accepted requests ${requestIds.join(', ')}, but checking their status failed: ${reason}. The upload itself went through and running this step again would send the members again; ${STATUS_CHECK_HINT} instead.`
    );
  }
}

function statusOf(destinations: GoogleAdsRequestStatusPerDestination[]): string {
  return aggregateStatus(destinations.map((d) => d.requestStatus ?? 'PROCESSING'));
}

function aggregateStatus(statuses: string[]): string {
  if (statuses.length === 0 || statuses.some((s) => !FINAL_STATUSES.has(s))) return 'PROCESSING';
  if (statuses.every((s) => s === 'SUCCESS')) return 'SUCCESS';
  if (statuses.every((s) => s === 'FAILED')) return 'FAILED';
  return 'PARTIAL_SUCCESS';
}

export const googleAdsApi = {
  listAccessibleCustomers,
  search,
  searchAll,
  mutateRecord,
  listCustomerClients,
  getCustomerInfo,
  listContactInfoUserLists,
  listNewestRecords,
  listRecordsAfterId,
  listRecordsByResourceNames,
  listCreateEvents,
  uploadCustomerMatch,
};

const MAX_CUSTOMER_CLIENTS = 2000;
const MAX_USER_LISTS = 2000;
const MAX_ROWS_PER_POLL = 1000;
const NAMES_PER_QUERY = 500;
const MEMBERS_PER_REQUEST = 10_000;
const STATUS_POLLS = 12;
const STATUS_POLL_INTERVAL_MS = 10_000;
const FINAL_STATUSES = new Set(['SUCCESS', 'PARTIAL_SUCCESS', 'FAILED']);
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2}(\.\d{1,6})?)?$/;
const CONSENT = { GRANTED: 'CONSENT_GRANTED', DENIED: 'CONSENT_DENIED', UNSPECIFIED: 'CONSENT_STATUS_UNSPECIFIED' };
const STATUS_CHECK_HINT =
  'check each request with Custom API Call: method GET, URL https://datamanager.googleapis.com/v1/requestStatus:retrieve?requestId=<request id>';

type SearchParams = { customerId: string; query: string; pageToken?: string };

type MutateRecordParams = { customerId: string; def: GoogleAdsResourceDefinition; operation: GoogleAdsRecordOperation; validateOnly: boolean };

type ListCreateEventsParams = { customerId: string; changeEventType: string; after: string; until: string; order: 'ASC' | 'DESC'; limit: number };
