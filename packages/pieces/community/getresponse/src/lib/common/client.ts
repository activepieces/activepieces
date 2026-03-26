import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

export async function validateGetResponseApiKey(apiKey: string): Promise<void> {
  await sendGetRequest<GetResponseCampaign[]>({
    apiKey,
    path: '/campaigns',
    queryParams: {
      perPage: '1',
      page: '1',
    },
  });
}

export async function listGetResponseCampaigns({
  apiKey,
  limit = 1000,
  name,
}: {
  apiKey: string;
  limit?: number;
  name?: string;
}): Promise<GetResponseCampaign[]> {
  return sendGetRequest<GetResponseCampaign[]>({
    apiKey,
    path: '/campaigns',
    queryParams: {
      perPage: String(Math.min(limit, 1000)),
      page: '1',
      ...(name ? { 'query[name]': name } : {}),
    },
  });
}

export async function listGetResponseFromFields(
  apiKey: string,
): Promise<GetResponseFromField[]> {
  return sendGetRequest<GetResponseFromField[]>({
    apiKey,
    path: '/from-fields',
    queryParams: {
      perPage: '1000',
      page: '1',
      'query[isActive]': 'true',
    },
  });
}

export async function listGetResponseContacts({
  apiKey,
  email,
  campaignId,
}: {
  apiKey: string;
  email: string;
  campaignId?: string;
}): Promise<GetResponseContact[]> {
  return sendGetRequest<GetResponseContact[]>({
    apiKey,
    path: '/contacts',
    queryParams: {
      perPage: '1000',
      page: '1',
      'query[email]': email,
      ...(campaignId ? { 'query[campaignId]': campaignId } : {}),
    },
  });
}

export async function createGetResponseContact({
  apiKey,
  request,
}: {
  apiKey: string;
  request: GetResponseNewContactRequest;
}): Promise<GetResponseContact> {
  return sendPostRequest<GetResponseNewContactRequest, GetResponseContact>({
    apiKey,
    path: '/contacts',
    body: request,
  });
}

export async function updateGetResponseContact({
  apiKey,
  contactId,
  request,
}: {
  apiKey: string;
  contactId: string;
  request: GetResponseUpdateContactRequest;
}): Promise<GetResponseContact> {
  return sendPostRequest<GetResponseUpdateContactRequest, GetResponseContact>({
    apiKey,
    path: `/contacts/${contactId}`,
    body: request,
  });
}

export async function createGetResponseNewsletter({
  apiKey,
  request,
}: {
  apiKey: string;
  request: GetResponseNewNewsletterRequest;
}): Promise<GetResponseNewsletter> {
  return sendPostRequest<GetResponseNewNewsletterRequest, GetResponseNewsletter>(
    {
      apiKey,
      path: '/newsletters',
      body: request,
    },
  );
}

export function flattenGetResponseCampaign(
  campaign: GetResponseCampaign,
): GetResponseFlatRecord {
  return {
    campaign_id: campaign.campaignId,
    name: campaign.name ?? null,
    description: campaign.description ?? null,
    language_code: campaign.languageCode ?? null,
    is_default: campaign.isDefault ?? null,
    created_on: campaign.createdOn ?? null,
    href: campaign.href ?? null,
  };
}

export function flattenGetResponseContact(
  contact: GetResponseContact,
): GetResponseFlatRecord {
  return {
    contact_id: contact.contactId,
    name: contact.name ?? null,
    email: contact.email,
    campaign_id: contact.campaign?.campaignId ?? null,
    campaign_name: contact.campaign?.name ?? null,
    day_of_cycle: contact.dayOfCycle ?? null,
    scoring: contact.scoring ?? null,
    engagement_score: contact.engagementScore ?? null,
    origin: contact.origin ?? null,
    time_zone: contact.timeZone ?? null,
    note: contact.note ?? null,
    tags: formatContactTags(contact.tags),
    custom_field_values: formatContactCustomFieldValues(
      contact.customFieldValues,
    ),
    created_on: contact.createdOn ?? null,
    changed_on: contact.changedOn ?? null,
    href: contact.href ?? null,
  };
}

export function flattenGetResponseNewsletter(
  newsletter: GetResponseNewsletter,
): GetResponseFlatRecord {
  return {
    newsletter_id: newsletter.newsletterId,
    name: newsletter.name ?? null,
    subject: newsletter.subject ?? null,
    type: newsletter.type ?? null,
    status: newsletter.status ?? null,
    campaign_id: newsletter.campaign?.campaignId ?? null,
    campaign_name: newsletter.campaign?.name ?? null,
    from_field_id: newsletter.fromField?.fromFieldId ?? null,
    reply_to_field_id: newsletter.replyTo?.fromFieldId ?? null,
    selected_campaigns: newsletter.sendSettings?.selectedCampaigns.join(', ') ?? null,
    content_html: newsletter.content?.html ?? null,
    content_plain: newsletter.content?.plain ?? null,
    send_on: newsletter.sendOn ?? null,
    created_on: newsletter.createdOn ?? null,
    href: newsletter.href ?? null,
  };
}

function sendGetRequest<TResponse>({
  apiKey,
  path,
  queryParams,
}: {
  apiKey: string;
  path: string;
  queryParams?: GetResponseQueryParams;
}): Promise<TResponse> {
  return sendRequest<TResponse>({
    apiKey,
    method: HttpMethod.GET,
    path,
    queryParams,
  });
}

function sendPostRequest<TRequest extends Record<string, unknown>, TResponse>({
  apiKey,
  path,
  body,
}: {
  apiKey: string;
  path: string;
  body: TRequest;
}): Promise<TResponse> {
  return sendRequest<TResponse>({
    apiKey,
    method: HttpMethod.POST,
    path,
    body,
  });
}

async function sendRequest<TResponse>({
  apiKey,
  method,
  path,
  body,
  queryParams,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
  queryParams?: GetResponseQueryParams;
}): Promise<TResponse> {
  const request: HttpRequest<Record<string, unknown> | string> = {
    method,
    url: `${GETRESPONSE_API_URL}${path}`,
    headers: createHeaders(apiKey),
    queryParams,
    body,
  };
  const response = await httpClient.sendRequest<TResponse>(request);
  return response.body;
}

function createHeaders(apiKey: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Auth-Token': `api-key ${apiKey}`,
  };
}

function formatContactTags(
  tags: GetResponseContactTag[] | undefined,
): string | null {
  if (!tags || tags.length === 0) {
    return null;
  }
  return tags.map((tag) => tag.name ?? tag.tagId).join(', ');
}

function formatContactCustomFieldValues(
  customFieldValues: GetResponseContactCustomFieldValue[] | undefined,
): string | null {
  if (!customFieldValues || customFieldValues.length === 0) {
    return null;
  }
  return customFieldValues
    .map((customFieldValue) => {
      const joinedValues = customFieldValue.value.join('|');
      return `${customFieldValue.customFieldId}:${joinedValues}`;
    })
    .join(', ');
}

const GETRESPONSE_API_URL = 'https://api.getresponse.com/v3';

export type GetResponseFlatRecord = Record<
  string,
  string | number | boolean | null
>;

type GetResponseCampaign = {
  campaignId: string;
  name?: string | null;
  description?: string | null;
  languageCode?: string | null;
  isDefault?: string | null;
  createdOn?: string | null;
  href?: string | null;
};

type GetResponseCampaignReference = {
  campaignId: string;
  name?: string | null;
  href?: string | null;
};

type GetResponseContact = {
  contactId: string;
  name?: string | null;
  email: string;
  campaign?: GetResponseCampaignReference | null;
  dayOfCycle?: string | null;
  scoring?: number | null;
  engagementScore?: number | null;
  origin?: string | null;
  timeZone?: string | null;
  note?: string | null;
  tags?: GetResponseContactTag[];
  customFieldValues?: GetResponseContactCustomFieldValue[];
  createdOn?: string | null;
  changedOn?: string | null;
  href?: string | null;
};

type GetResponseContactCustomFieldValue = {
  customFieldId: string;
  value: string[];
};

type GetResponseContactTag = {
  tagId: string;
  name?: string | null;
};

type GetResponseFromField = {
  fromFieldId: string;
  email: string;
  name?: string | null;
  isActive?: string | null;
  isDefault?: string | null;
  createdOn?: string | null;
  href?: string | null;
};

type GetResponseFromFieldReference = {
  fromFieldId: string;
  href?: string | null;
};

type GetResponseMessageContent = {
  html?: string;
  plain?: string;
};

type GetResponseNewContactRequest = {
  email: string;
  campaign: GetResponseCampaignReference;
  name?: string;
};

type GetResponseNewNewsletterRequest = {
  subject: string;
  fromField: GetResponseFromFieldReference;
  campaign: GetResponseCampaignReference;
  content: GetResponseMessageContent;
  sendSettings: GetResponseNewsletterSendSettings;
  name?: string;
  replyTo?: GetResponseFromFieldReference;
};

type GetResponseNewsletter = {
  newsletterId: string;
  name?: string | null;
  subject?: string | null;
  type?: string | null;
  status?: string | null;
  campaign?: GetResponseCampaignReference | null;
  fromField?: GetResponseFromFieldReference | null;
  replyTo?: GetResponseFromFieldReference | null;
  sendSettings?: GetResponseNewsletterSendSettings;
  content?: GetResponseMessageContent | null;
  sendOn?: string | null;
  createdOn?: string | null;
  href?: string | null;
};

type GetResponseNewsletterSendSettings = {
  selectedCampaigns: string[];
};

type GetResponseQueryParams = Record<string, string>;

type GetResponseUpdateContactRequest = {
  campaign?: GetResponseCampaignReference;
  email?: string;
  name?: string;
};
