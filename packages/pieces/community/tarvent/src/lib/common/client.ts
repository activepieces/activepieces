import { TarventApiError, TarventCredentials, tarventTransport } from './transport';

const PAGE_SIZE = 50;
const DROPDOWN_MAX_PAGES = 20;
const NOT_FOUND_CODE = '1030';

const CONTACT_FIELDS = 'id email firstName lastName status tags groups { id name } rating latitude longitude streetAddress streetAddress2 addressLocality addressRegion postalCode addressCountry timeZone language sendFormat optInUtc confirmedUtc optOutUtc profileFields { id dataField { id labelText } value } createdUtc modifiedUtc';
const AUDIENCE_FIELDS = 'id name companyName streetAddress streetAddress2 addressLocality addressRegion postalCode addressCountry phone website totalContacts totalActiveContacts totalUnconfirmedContacts totalUndeliverableContacts totalUnsubscribedContacts totalComplaintContacts totalSuppressedContacts tags customKeyDataField { id labelText } createdUtc lastModifiedUtc';
const CAMPAIGN_FIELDS = 'id tags name audienceId description mvWinType timeJumper sendStatus scheduledToSendUtc createdUtc modifiedUtc';
const JOURNEY_FIELDS = 'id tags name audienceId description reEntryType status totalEmailNodes totalNotificationEmailNodes totalSiteNotificationNodes totalSMSNodes createdUtc modifiedUtc';
const PAGE_INFO = 'pageInfo { hasNextPage endCursor }';
const CAMPAIGN_STATS_FIELDS = 'campaignId totalSent totalDelivered totalDeliveredPct totalOpens uniqueOpens uniqueOpensPct totalClicks uniqueClicks uniqueClicksPct clickToOpenPct totalReplies uniqueReplies uniqueRepliesPct totalBounce totalBouncePct uniqueHardBounce uniqueHardBouncePct uniqueSoftBounce uniqueSoftBouncePct uniqueOptOut uniqueOptOutPct uniqueSpam uniqueSpamPct uniqueSuppressed engagementScore engagementScoreAvg senderReputation sendDomain';
const TRANSACTION_FIELDS = 'id requestId status recipient recipientName recipientType from fromName replyTo subject groupName tags error bounceCategory openCount clickCount sendCount complaint unsubscribe contactId sendAtUtc processedUtc createdUtc modifiedUtc';

function isNotFound(error: unknown): boolean {
  return error instanceof TarventApiError && error.code === NOT_FOUND_CODE;
}

async function assertAudienceReadable({ auth, audienceId }: { auth: TarventCredentials; audienceId: string }): Promise<void> {
  await listPage<{ id: string }>({
    auth,
    operation: 'CheckAudience',
    field: 'contacts',
    selection: 'id',
    argDefs: ', $input: GetAllContactsInput!',
    args: ', input: $input',
    variables: { input: { audienceId } },
    first: 1,
  });
}

function isContactNotFound(error: unknown): boolean {
  return isNotFound(error) && error instanceof Error && /contact/i.test(error.message) && !/audience/i.test(error.message);
}

async function listPage<T>({
  auth,
  operation,
  field,
  selection,
  argDefs = '',
  args = '',
  variables = {},
  first = PAGE_SIZE,
  after,
  withTotalCount = false,
}: {
  auth: TarventCredentials;
  operation: string;
  field: string;
  selection: string;
  argDefs?: string;
  args?: string;
  variables?: Record<string, unknown>;
  first?: number;
  after?: string;
  withTotalCount?: boolean;
}): Promise<TarventPage<T>> {
  const query = `query ${operation}($first: Int, $after: String${argDefs}) { ${field}(first: $first, after: $after${args}) { ${withTotalCount ? 'totalCount ' : ''}nodes { ${selection} } ${PAGE_INFO} } }`;
  const connection = await tarventTransport.field<TarventConnection<T>>({
    auth,
    query,
    variables: { ...variables, first, after: after ?? null },
    name: field,
  });
  const items = connection.nodes ?? [];
  const hasMore = connection.pageInfo?.hasNextPage === true;
  return {
    items,
    count: items.length,
    totalCount: typeof connection.totalCount === 'number' ? connection.totalCount : null,
    hasMore,
    nextCursor: hasMore ? connection.pageInfo?.endCursor ?? null : null,
  };
}

async function listAll<T>(params: Parameters<typeof listPage>[0] & { maxPages?: number }): Promise<{ items: T[]; truncated: boolean }> {
  const { maxPages = DROPDOWN_MAX_PAGES, ...rest } = params;
  const pages: T[][] = [];
  let after: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const result = await listPage<T>({ ...rest, after });
    pages.push(result.items);
    if (!result.hasMore || !result.nextCursor) {
      return { items: pages.flat(), truncated: false };
    }
    after = result.nextCursor;
  }
  return { items: pages.flat(), truncated: true };
}

function andFilter(filters: Record<string, unknown>[]): Record<string, unknown> | null {
  return filters.length === 0 ? null : { and: filters };
}

function splitList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function audienceWhere({ name, tags }: { name?: string; tags?: string }): Record<string, unknown> | null {
  const tagList = splitList(tags);
  return andFilter([
    ...(name && name.trim() ? [{ name: { contains: name.trim() } }] : []),
    ...(tagList.length > 0 ? [{ tags: { some: { in: tagList } } }] : []),
  ]);
}

function campaignWhere({ name, tags, status }: { name?: string; tags?: string; status?: string }): Record<string, unknown> | null {
  const tagList = splitList(tags);
  const statuses = splitList(status).flatMap((s) => {
    if (s === 'PENDING') return ['PENDING', 'PROCESSING', 'QUEUED'];
    if (s === 'STOPPED') return ['STOPPED', 'SYSTEM_STOPPED'];
    if (s === 'Paused') return ['PAUSED'];
    return [s];
  });
  return andFilter([
    ...(name && name.trim() ? [{ name: { contains: name.trim() } }] : []),
    ...(tagList.length > 0 ? [{ tags: { some: { in: tagList } } }] : []),
    ...(statuses.length > 0 ? [{ sendStatus: { in: statuses } }] : []),
  ]);
}

function journeyWhere({ name, tags, status }: { name?: string; tags?: string; status?: string }): Record<string, unknown> | null {
  const tagList = splitList(tags);
  const statuses = splitList(status);
  return andFilter([
    ...(name && name.trim() ? [{ name: { contains: name.trim() } }] : []),
    ...(tagList.length > 0 ? [{ tags: { some: { in: tagList } } }] : []),
    ...(statuses.length > 0 ? [{ status: { in: statuses } }] : []),
  ]);
}

function dropdownCampaignWhere({ ignoreStatus, isEvent }: { ignoreStatus: boolean; isEvent: boolean }): Record<string, unknown> {
  const statusFilter = ignoreStatus
    ? { sendStatus: { nin: ['PAUSED', 'PENDING', 'PROCESSING', 'QUEUED', 'SYSTEM_STOPPED'] } }
    : { sendStatus: { in: isEvent ? ['NOT_SCHEDULED', 'COMPLETED'] : ['NOT_SCHEDULED', 'READY_TO_SEND'] } };
  return { and: [{ isArchived: { eq: false } }, statusFilter] };
}

async function getContact({
  auth,
  audienceId,
  contactId,
  email,
}: {
  auth: TarventCredentials;
  audienceId: string;
  contactId?: string;
  email?: string;
}): Promise<TarventContact | null> {
  try {
    return await tarventTransport.field<TarventContact>({
      auth,
      query: `query GetContact($input: GetContactInput!) { contact(input: $input) { ${CONTACT_FIELDS} } }`,
      variables: { input: { audienceId, emailAddress: email ?? null, id: contactId ?? null } },
      name: 'contact',
    });
  } catch (error) {
    if (isContactNotFound(error)) {
      await assertAudienceReadable({ auth, audienceId });
      return null;
    }
    throw error;
  }
}

async function createContact({ auth, input }: { auth: TarventCredentials; input: Record<string, unknown> }): Promise<TarventContact> {
  return tarventTransport.field<TarventContact>({
    auth,
    query: `mutation CreateContact($input: CreateContactInput!) { createContact(input: $input) { ${CONTACT_FIELDS} } }`,
    variables: { input },
    name: 'createContact',
  });
}

async function updateContact({ auth, input }: { auth: TarventCredentials; input: Record<string, unknown> }): Promise<TarventContact> {
  return tarventTransport.field<TarventContact>({
    auth,
    query: `mutation UpdateContact($input: UpdateContactInput!) { updateContact(input: $input) { ${CONTACT_FIELDS} } }`,
    variables: { input },
    name: 'updateContact',
  });
}

async function booleanMutation({
  auth,
  operation,
  field,
  argDefs,
  args,
  variables,
}: {
  auth: TarventCredentials;
  operation: string;
  field: string;
  argDefs: string;
  args: string;
  variables: Record<string, unknown>;
}): Promise<boolean> {
  const result = await tarventTransport.field<unknown>({
    auth,
    query: `mutation ${operation}(${argDefs}) { ${field}(${args}) }`,
    variables,
    name: field,
  });
  if (result !== true) {
    throw new TarventApiError(`Tarvent did not confirm ${field} (returned ${JSON.stringify(result)}).`, undefined, 200, result);
  }
  return true;
}

async function createWebhook({
  auth,
  name,
  callBackUrl,
  events,
  filter,
  dataSettings,
}: {
  auth: TarventCredentials;
  name: string;
  callBackUrl: string;
  events: TarventWebhookEvent[];
  filter: Record<string, unknown> | null;
  dataSettings: string;
}): Promise<{ id: string }> {
  return tarventTransport.field<{ id: string }>({
    auth,
    query:
      'mutation CreateWebhook($name: String!, $description: String, $events: [WebhookEventInput!]!, $callBackUrl: String!, $dataSettings: WebhookDataSetting, $filter: ConditionGroupInput) { createWebhook(name: $name, description: $description, events: $events, callBackUrl: $callBackUrl, dataSettings: $dataSettings, filter: $filter) { id } }',
    variables: { name, description: '', callBackUrl, events, filter, dataSettings },
    name: 'createWebhook',
  });
}

async function deleteWebhook({ auth, id }: { auth: TarventCredentials; id: string }): Promise<void> {
  try {
    await booleanMutation({
      auth,
      operation: 'DeleteWebhook',
      field: 'deleteWebhook',
      argDefs: '$id: String!',
      args: 'id: $id',
      variables: { id },
    });
  } catch (error) {
    if (isNotFound(error)) {
      return;
    }
    throw error;
  }
}

export const tarventClient = {
  listPage,
  listAll,
  audienceWhere,
  campaignWhere,
  journeyWhere,
  dropdownCampaignWhere,
  getContact,
  createContact,
  updateContact,
  booleanMutation,
  createWebhook,
  deleteWebhook,
  isNotFound,
  splitList,
  pageSize: PAGE_SIZE,
  fields: {
    contact: CONTACT_FIELDS,
    audience: AUDIENCE_FIELDS,
    campaign: CAMPAIGN_FIELDS,
    journey: JOURNEY_FIELDS,
    campaignStats: CAMPAIGN_STATS_FIELDS,
    transaction: TRANSACTION_FIELDS,
  },
};

export type TarventPage<T> = {
  items: T[];
  count: number;
  totalCount: number | null;
  hasMore: boolean;
  nextCursor: string | null;
};

export type TarventConnection<T> = {
  totalCount?: number;
  nodes?: T[];
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

export type TarventWebhookEvent = { entityType: string | null; eventType: string };

export type TarventContact = Record<string, unknown> & { id: string };
