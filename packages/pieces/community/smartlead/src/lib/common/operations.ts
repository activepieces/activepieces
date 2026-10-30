import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { smartleadRequest, SmartleadApiError } from './client';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function pick({ source, key }: { source: unknown; key: string }): unknown {
  return isRecord(source) ? source[key] ?? null : null;
}

function requireId({ value, label }: { value: unknown; label: string }): number {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return parsed;
}

function pageParams({ offset, limit }: { offset: unknown; limit: unknown }): { offset: number; limit: number } {
  const safeOffset = typeof offset === 'number' && Number.isInteger(offset) && offset >= 0 ? offset : 0;
  if (!isNil(limit) && (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)) {
    throw new Error(`Limit must be a whole number between 1 and ${MAX_PAGE_SIZE}.`);
  }
  return { offset: safeOffset, limit: typeof limit === 'number' ? limit : MAX_PAGE_SIZE };
}

function requireCampaignBody({ response, id }: { response: unknown; id: number }): Record<string, unknown> {
  if (!isRecord(response) || Object.keys(response).length === 0) {
    throw new Error(`Campaign ${id} not found.`);
  }
  return response;
}

async function createCampaign({
  apiKey,
  name,
  clientId,
}: {
  apiKey: string;
  name: string;
  clientId?: number | null;
}) {
  const trimmed = typeof name === 'string' ? name.trim() : '';
  if (trimmed === '') {
    throw new Error('Campaign name is required.');
  }
  const body: Record<string, unknown> = { name: trimmed };
  if (!isNil(clientId)) {
    body['client_id'] = requireId({ value: clientId, label: 'Client ID' });
  }
  const response = await smartleadRequest<unknown>({
    endpoint: 'campaigns/create',
    method: HttpMethod.POST,
    apiKey,
    body,
  });
  return {
    ok: pick({ source: response, key: 'ok' }) ?? true,
    id: pick({ source: response, key: 'id' }),
    name: pick({ source: response, key: 'name' }),
    created_at: pick({ source: response, key: 'created_at' }),
  };
}

function parseLeadList(leadList: unknown): Record<string, unknown>[] {
  let leads: unknown = leadList;
  if (typeof leadList === 'string') {
    try {
      leads = JSON.parse(leadList);
    } catch {
      throw new Error('Lead list is not valid JSON. Provide a JSON array of lead objects.');
    }
  }
  if (!Array.isArray(leads)) {
    throw new Error('Lead list must be a JSON array of lead objects with at least an "email" field.');
  }
  if (leads.length === 0) {
    throw new Error('Lead list must contain at least one lead.');
  }
  if (leads.length > MAX_LEADS_PER_REQUEST) {
    throw new Error(
      `Maximum ${MAX_LEADS_PER_REQUEST} leads per request. Got ${leads.length}. Split into multiple requests.`
    );
  }
  const result: Record<string, unknown>[] = [];
  leads.forEach((lead: unknown, index: number) => {
    if (!isRecord(lead)) {
      throw new Error(`Lead at index ${index} must be an object.`);
    }
    const email = lead['email'];
    if (typeof email !== 'string' || email.trim() === '') {
      throw new Error(`Lead at index ${index} is missing a required "email" field.`);
    }
    const compact = Object.fromEntries(
      Object.entries(lead).filter(([, value]) => value !== undefined && value !== null && value !== '')
    );
    result.push({ ...compact, email: email.trim() });
  });
  return result;
}

async function addLeadsToCampaign({
  apiKey,
  campaignId,
  leadList,
  flags,
}: {
  apiKey: string;
  campaignId: unknown;
  leadList: unknown;
  flags: LeadUploadFlags;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const leads = parseLeadList(leadList);
  const body: Record<string, unknown> = { lead_list: leads };
  const settings: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(flags)) {
    if (value === true) {
      settings[key] = true;
    }
  }
  if (Object.keys(settings).length > 0) {
    body['settings'] = settings;
  }
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/leads`,
    method: HttpMethod.POST,
    apiKey,
    body,
  });
  return {
    ok: pick({ source: response, key: 'ok' }) ?? true,
    upload_count: pick({ source: response, key: 'upload_count' }),
    total_leads: pick({ source: response, key: 'total_leads' }),
    already_added_to_campaign: pick({ source: response, key: 'already_added_to_campaign' }),
    duplicate_count: pick({ source: response, key: 'duplicate_count' }),
    invalid_email_count: pick({ source: response, key: 'invalid_email_count' }),
    unsubscribed_leads: pick({ source: response, key: 'unsubscribed_leads' }),
    block_count: pick({ source: response, key: 'block_count' }),
  };
}

async function getCampaignStatistics({ apiKey, campaignId }: { apiKey: string; campaignId: unknown }) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/analytics`,
    method: HttpMethod.GET,
    apiKey,
  });
  return requireCampaignBody({ response, id });
}

function mergeTrackSettings({
  current,
  trackOpens,
  trackClicks,
}: {
  current: unknown;
  trackOpens: boolean | null | undefined;
  trackClicks: boolean | null | undefined;
}): string[] {
  if (!Array.isArray(current)) {
    throw new Error(
      'SmartLead did not return the current tracking settings for this campaign, so tracking was not changed to avoid clearing other tracking options. Update the other settings without tracking, or change tracking in SmartLead.'
    );
  }
  const existing = current
    .filter((v: unknown): v is string => typeof v === 'string')
    .map((v) => READ_TRACK_ALIASES[v] ?? v);
  const next = new Set(existing);
  const apply = ({ flag, track }: { flag: string; track: boolean | null | undefined }) => {
    if (track === true) next.delete(flag);
    if (track === false) next.add(flag);
  };
  apply({ flag: DONT_TRACK_OPEN, track: trackOpens });
  apply({ flag: DONT_TRACK_CLICK, track: trackClicks });
  return [...next];
}

async function updateCampaignSettings({
  apiKey,
  campaignId,
  settings,
}: {
  apiKey: string;
  campaignId: unknown;
  settings: CampaignSettingsInput;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const body: Record<string, unknown> = {};

  if (!isNil(settings.trackOpens) || !isNil(settings.trackClicks)) {
    const campaign = await smartleadRequest<unknown>({
      endpoint: `campaigns/${id}`,
      method: HttpMethod.GET,
      apiKey,
    });
    body['track_settings'] = mergeTrackSettings({
      current: pick({ source: campaign, key: 'track_settings' }),
      trackOpens: settings.trackOpens,
      trackClicks: settings.trackClicks,
    });
  }
  if (!isNil(settings.stopLeadSettings) && settings.stopLeadSettings !== '') {
    const raw = settings.stopLeadSettings;
    const value = LEGACY_STOP_LEAD_VALUES[raw] ?? raw;
    if (!STOP_LEAD_OPTIONS.some((o) => o.value === value)) {
      throw new Error(`Stop lead condition must be one of ${STOP_LEAD_OPTIONS.map((o) => o.value).join(', ')}.`);
    }
    body['stop_lead_settings'] = value;
  }
  if (!isNil(settings.unsubscribeText) && settings.unsubscribeText !== '') {
    body['unsubscribe_text'] = settings.unsubscribeText;
  }
  if (!isNil(settings.enableAiEspMatching)) {
    body['enable_ai_esp_matching'] = settings.enableAiEspMatching;
  }
  if (!isNil(settings.sendAsPlainText)) {
    body['send_as_plain_text'] = settings.sendAsPlainText;
  }
  if (!isNil(settings.followUpPercentage)) {
    const pct = settings.followUpPercentage;
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      throw new Error(`Follow up percentage must be between 0 and 100. Got ${pct}.`);
    }
    body['follow_up_percentage'] = pct;
  }
  if (Object.keys(body).length === 0) {
    throw new Error('At least one setting must be provided to update.');
  }
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/settings`,
    method: HttpMethod.POST,
    apiKey,
    body,
  });
  return { ok: pick({ source: response, key: 'ok' }) ?? true, campaign_id: id, updated: body };
}

function mapCampaignSummary(campaign: unknown) {
  return {
    id: pick({ source: campaign, key: 'id' }),
    name: pick({ source: campaign, key: 'name' }),
    status: pick({ source: campaign, key: 'status' }),
    created_at: pick({ source: campaign, key: 'created_at' }),
    updated_at: pick({ source: campaign, key: 'updated_at' }),
    client_id: pick({ source: campaign, key: 'client_id' }),
  };
}

async function listCampaigns({ apiKey, clientId }: { apiKey: string; clientId?: number | null }) {
  const response = await smartleadRequest<unknown>({
    endpoint: 'campaigns',
    method: HttpMethod.GET,
    apiKey,
    queryParams: isNil(clientId) ? {} : { client_id: requireId({ value: clientId, label: 'Client ID' }) },
  });
  const campaigns = Array.isArray(response) ? response.map(mapCampaignSummary) : [];
  return { campaigns };
}

async function getCampaign({ apiKey, campaignId }: { apiKey: string; campaignId: unknown }) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}`,
    method: HttpMethod.GET,
    apiKey,
  });
  return requireCampaignBody({ response, id });
}

async function updateCampaignStatus({
  apiKey,
  campaignId,
  status,
}: {
  apiKey: string;
  campaignId: unknown;
  status: unknown;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const match = CAMPAIGN_STATUSES.find((s) => s === status);
  if (isNil(match)) {
    throw new Error(`Status must be one of ${CAMPAIGN_STATUSES.join(', ')}.`);
  }
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/status`,
    method: HttpMethod.POST,
    apiKey,
    body: { status: match },
  });
  return { ok: pick({ source: response, key: 'ok' }) ?? true, campaign_id: id, status: match };
}

async function deleteCampaign({ apiKey, campaignId }: { apiKey: string; campaignId: unknown }) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}`,
    method: HttpMethod.DELETE,
    apiKey,
  });
  return { ok: pick({ source: response, key: 'ok' }) ?? true, campaign_id: id };
}

async function listCampaignLeads({
  apiKey,
  campaignId,
  offset,
  limit,
}: {
  apiKey: string;
  campaignId: unknown;
  offset: unknown;
  limit: unknown;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const page = pageParams({ offset, limit });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/leads`,
    method: HttpMethod.GET,
    apiKey,
    queryParams: page,
  });
  const data = pick({ source: response, key: 'data' });
  return {
    total_leads: pick({ source: response, key: 'total_leads' }),
    offset: page.offset,
    limit: page.limit,
    leads: Array.isArray(data) ? data : [],
  };
}

async function findLeadByEmail({ apiKey, email }: { apiKey: string; email: unknown }) {
  const trimmed = typeof email === 'string' ? email.trim() : '';
  if (trimmed === '') {
    throw new Error('Email is required.');
  }
  const response = await smartleadRequest<unknown>({
    endpoint: 'leads/',
    method: HttpMethod.GET,
    apiKey,
    queryParams: { email: trimmed },
  });
  if (!isRecord(response) || isNil(response['id'])) {
    return { found: false, lead: null };
  }
  return { found: true, lead: response };
}

async function updateLeadStatusInCampaign({
  apiKey,
  campaignId,
  leadId,
  action,
}: {
  apiKey: string;
  campaignId: unknown;
  leadId: unknown;
  action: unknown;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const lead = requireId({ value: leadId, label: 'Lead ID' });
  const match = LEAD_STATUS_ACTIONS.find((a) => a === action);
  if (isNil(match)) {
    throw new Error(`Action must be one of ${LEAD_STATUS_ACTIONS.join(', ')}.`);
  }
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/leads/${lead}/${match}`,
    method: HttpMethod.POST,
    apiKey,
    body: {},
  });
  return { ok: pick({ source: response, key: 'ok' }) ?? true, campaign_id: id, lead_id: lead, action: match };
}

async function deleteLeadFromCampaign({
  apiKey,
  campaignId,
  leadId,
}: {
  apiKey: string;
  campaignId: unknown;
  leadId: unknown;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const lead = requireId({ value: leadId, label: 'Lead ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/leads/${lead}`,
    method: HttpMethod.DELETE,
    apiKey,
  });
  return { ok: pick({ source: response, key: 'ok' }) ?? true, campaign_id: id, lead_id: lead };
}

async function listEmailAccounts({ apiKey, offset, limit }: { apiKey: string; offset: unknown; limit: unknown }) {
  const page = pageParams({ offset, limit });
  const response = await smartleadRequest<unknown>({
    endpoint: 'email-accounts',
    method: HttpMethod.GET,
    apiKey,
    queryParams: page,
  });
  const accounts = Array.isArray(response) ? response : [];
  return {
    offset: page.offset,
    limit: page.limit,
    email_accounts: accounts.map((account: unknown) => ({
      id: pick({ source: account, key: 'id' }),
      from_name: pick({ source: account, key: 'from_name' }),
      from_email: pick({ source: account, key: 'from_email' }),
      type: pick({ source: account, key: 'type' }),
      message_per_day: pick({ source: account, key: 'message_per_day' }),
      daily_sent_count: pick({ source: account, key: 'daily_sent_count' }),
      is_smtp_success: pick({ source: account, key: 'is_smtp_success' }),
      is_imap_success: pick({ source: account, key: 'is_imap_success' }),
      client_id: pick({ source: account, key: 'client_id' }),
      created_at: pick({ source: account, key: 'created_at' }),
    })),
  };
}

async function getLeadMessageHistory({
  apiKey,
  campaignId,
  leadId,
}: {
  apiKey: string;
  campaignId: unknown;
  leadId: unknown;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const lead = requireId({ value: leadId, label: 'Lead ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/leads/${lead}/message-history`,
    method: HttpMethod.GET,
    apiKey,
  });
  const history = pick({ source: response, key: 'history' });
  return { campaign_id: id, lead_id: lead, history: Array.isArray(history) ? history : [] };
}

async function createCampaignWebhook({
  apiKey,
  campaignId,
  webhookUrl,
  eventTypes,
}: {
  apiKey: string;
  campaignId: unknown;
  webhookUrl: string;
  eventTypes: string[];
}): Promise<number | string | null> {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  const response = await smartleadRequest<unknown>({
    endpoint: `campaigns/${id}/webhooks`,
    method: HttpMethod.POST,
    apiKey,
    body: {
      id: null,
      name: `Activepieces ${Date.now()}`,
      webhook_url: webhookUrl,
      event_types: eventTypes,
    },
  });
  const created = pick({ source: response, key: 'id' }) ?? pick({ source: pick({ source: response, key: 'data' }), key: 'id' });
  return typeof created === 'number' || typeof created === 'string' ? created : null;
}

function parseOnOff({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (isNil(value) || value === '') return undefined;
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : value;
  if (normalized === 'on' || normalized === true) return true;
  if (normalized === 'off' || normalized === false) return false;
  throw new Error(`${label} must be "on", "off" or omitted.`);
}

function parseTriStateBoolean({ value, label }: { value: unknown; label: string }): boolean | undefined {
  if (isNil(value)) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === '') return undefined;
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  throw new Error(`${label} must be true, false or left empty.`);
}

async function deleteCampaignWebhook({
  apiKey,
  campaignId,
  webhookId,
}: {
  apiKey: string;
  campaignId: unknown;
  webhookId: number | string;
}) {
  const id = requireId({ value: campaignId, label: 'Campaign ID' });
  try {
    await smartleadRequest<unknown>({
      endpoint: `campaigns/${id}/webhooks`,
      method: HttpMethod.DELETE,
      apiKey,
      body: { id: webhookId },
    });
  } catch (error: unknown) {
    if (error instanceof SmartleadApiError && error.statusCode === 404) {
      return;
    }
    throw error;
  }
}

async function listCampaignOptions({ apiKey }: { apiKey: string }) {
  const { campaigns } = await listCampaigns({ apiKey });
  return campaigns
    .filter((c): c is typeof c & { id: number } => typeof c.id === 'number')
    .map((c) => ({ label: `${typeof c.name === 'string' ? c.name : 'Untitled'} (${c.id})`, value: c.id }));
}

type LeadUploadFlags = {
  ignore_global_block_list?: boolean | null;
  ignore_unsubscribe_list?: boolean | null;
  ignore_duplicate_leads_in_other_campaign?: boolean | null;
  ignore_community_bounce_list?: boolean | null;
};

type CampaignSettingsInput = {
  trackOpens?: boolean | null;
  trackClicks?: boolean | null;
  stopLeadSettings?: string | null;
  unsubscribeText?: string | null;
  enableAiEspMatching?: boolean | null;
  sendAsPlainText?: boolean | null;
  followUpPercentage?: number | null;
};

const MAX_LEADS_PER_REQUEST = 400;
const MAX_PAGE_SIZE = 100;
const DONT_TRACK_OPEN = 'DONT_TRACK_EMAIL_OPEN';
const DONT_TRACK_CLICK = 'DONT_TRACK_LINK_CLICK';
const READ_TRACK_ALIASES: Record<string, string> = {
  DONT_EMAIL_OPEN: DONT_TRACK_OPEN,
  DONT_LINK_CLICK: DONT_TRACK_CLICK,
  DONT_REPLY_TO_AN_EMAIL: 'DONT_TRACK_REPLY_TO_AN_EMAIL',
};
const CAMPAIGN_STATUSES: readonly string[] = ['START', 'PAUSED', 'STOPPED'];
const LEAD_STATUS_ACTIONS: readonly string[] = ['pause', 'resume', 'unsubscribe'];
const SMARTLEAD_WEBHOOK_EVENTS = [
  { label: 'Email Sent', value: 'EMAIL_SENT' },
  { label: 'Email Opened', value: 'EMAIL_OPEN' },
  { label: 'Link Clicked', value: 'EMAIL_LINK_CLICK' },
  { label: 'Email Replied', value: 'EMAIL_REPLY' },
  { label: 'Lead Unsubscribed', value: 'LEAD_UNSUBSCRIBED' },
  { label: 'Lead Category Updated', value: 'LEAD_CATEGORY_UPDATED' },
];
const STOP_LEAD_OPTIONS = [
  { label: 'Reply to an email', value: 'REPLY_TO_AN_EMAIL' },
  { label: 'Opened an email', value: 'OPEN_AN_EMAIL' },
  { label: 'Clicked a link', value: 'CLICK_ON_A_LINK' },
];
const LEGACY_STOP_LEAD_VALUES: Record<string, string> = {
  OPENED_EMAIL: 'OPEN_AN_EMAIL',
  CLICKED_LINK: 'CLICK_ON_A_LINK',
};

export const smartleadOperations = {
  createCampaign,
  addLeadsToCampaign,
  getCampaignStatistics,
  updateCampaignSettings,
  parseTriStateBoolean,
  listCampaigns,
  getCampaign,
  updateCampaignStatus,
  deleteCampaign,
  listCampaignLeads,
  findLeadByEmail,
  updateLeadStatusInCampaign,
  deleteLeadFromCampaign,
  listEmailAccounts,
  getLeadMessageHistory,
  createCampaignWebhook,
  deleteCampaignWebhook,
  listCampaignOptions,
  parseOnOff,
};

export type { LeadUploadFlags, CampaignSettingsInput };
export {
  MAX_LEADS_PER_REQUEST,
  MAX_PAGE_SIZE,
  CAMPAIGN_STATUSES,
  LEAD_STATUS_ACTIONS,
  STOP_LEAD_OPTIONS,
  SMARTLEAD_WEBHOOK_EVENTS,
};
