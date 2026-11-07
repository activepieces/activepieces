import { HttpMethod } from '@activepieces/pieces-common';
import { isLemlistStatus, isRecord, lemlistApiCall } from './client';
import { lemlistInput } from './input';

async function getLeadsByEmail({
  apiKey,
  email,
}: {
  apiKey: string;
  email: string;
}): Promise<Record<string, unknown>[]> {
  try {
    const body = await lemlistApiCall<unknown>({
      apiKey,
      method: HttpMethod.GET,
      resourceUri: `/leads/${lemlistInput.emailSegment({ value: email, label: 'Lead Email' })}`,
      query: { version: 'v2' },
    });
    if (Array.isArray(body)) {
      return body.filter(isRecord);
    }
    return isRecord(body) ? [body] : [];
  } catch (error) {
    if (isLemlistStatus({ error, status: 404 })) {
      return [];
    }
    throw error;
  }
}

function leadCampaignId(lead: Record<string, unknown>): string | undefined {
  const campaign = lead['campaign'];
  if (isRecord(campaign)) {
    const id = campaign['id'] ?? campaign['_id'];
    if (typeof id === 'string') {
      return id;
    }
  }
  const direct = lead['campaignId'];
  return typeof direct === 'string' ? direct : undefined;
}

async function createLeadInCampaign({
  apiKey,
  campaignId,
  email,
  fields,
  deduplicate,
  linkedinEnrichment,
  findEmail,
  verifyEmail,
  findPhone,
}: {
  apiKey: string;
  campaignId: unknown;
  email: unknown;
  fields: Record<string, unknown>;
  deduplicate?: boolean;
  linkedinEnrichment?: boolean;
  findEmail?: boolean;
  verifyEmail?: boolean;
  findPhone?: boolean;
}): Promise<unknown> {
  const leadEmail = lemlistInput.email({ value: email, label: 'Lead Email' });
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: `/campaigns/${lemlistInput.idSegment({ value: campaignId, label: 'Campaign ID', prefix: 'cam' })}/leads/`,
    query: {
      deduplicate: deduplicate === true ? true : undefined,
      linkedinEnrichment: linkedinEnrichment === true ? true : undefined,
      findEmail: findEmail === true ? true : undefined,
      verifyEmail: verifyEmail === true ? true : undefined,
      findPhone: findPhone === true ? true : undefined,
    },
    body: { ...lemlistInput.compact(fields), email: leadEmail },
  });
}

async function updateLeadInCampaign({
  apiKey,
  campaignId,
  lead,
  fields,
}: {
  apiKey: string;
  campaignId: unknown;
  lead: unknown;
  fields: Record<string, unknown>;
}): Promise<unknown> {
  const body = lemlistInput.compact(fields);
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.PATCH,
    resourceUri: `/campaigns/${campaignSegment(campaignId)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}`,
    body,
  });
}

async function deleteLeadFromCampaign({
  apiKey,
  campaignId,
  lead,
  remove,
}: {
  apiKey: string;
  campaignId: unknown;
  lead: unknown;
  remove: boolean;
}): Promise<unknown> {
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.DELETE,
    resourceUri: `/campaigns/${campaignSegment(campaignId)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}`,
    query: { action: remove ? 'remove' : undefined },
  });
}

async function setInterestInCampaign({
  apiKey,
  campaignId,
  lead,
  interested,
}: {
  apiKey: string;
  campaignId: unknown;
  lead: unknown;
  interested: boolean;
}): Promise<unknown> {
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: `/campaigns/${campaignSegment(campaignId)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}/${interested ? 'interested' : 'notinterested'}`,
  });
}

async function setInterestEverywhere({
  apiKey,
  lead,
  interested,
}: {
  apiKey: string;
  lead: unknown;
  interested: boolean;
}): Promise<unknown> {
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: `/leads/${interested ? 'interested' : 'notinterested'}/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}`,
  });
}

async function setLeadPaused({
  apiKey,
  lead,
  campaignId,
  paused,
}: {
  apiKey: string;
  lead: unknown;
  campaignId?: unknown;
  paused: boolean;
}): Promise<unknown> {
  const campaign = lemlistInput.optionalText(campaignId);
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: `/leads/${paused ? 'pause' : 'start'}/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}`,
    query: {
      campaignId: campaign === undefined ? undefined : decodeURIComponent(campaignSegment(campaign)),
    },
  });
}

async function writeLeadVariables({
  apiKey,
  leadId,
  variables,
  method,
}: {
  apiKey: string;
  leadId: unknown;
  variables: unknown;
  method: HttpMethod.POST | HttpMethod.PATCH;
}): Promise<unknown> {
  return lemlistApiCall({
    apiKey,
    method,
    resourceUri: `/leads/${lemlistInput.idSegment({ value: leadId, label: 'Lead ID', prefix: 'lea' })}/variables`,
    body: lemlistInput.stringRecord({ value: variables, label: 'Custom Variables' }),
  });
}

async function removeFromUnsubscribes({
  apiKey,
  email,
}: {
  apiKey: string;
  email: unknown;
}): Promise<unknown> {
  return lemlistApiCall({
    apiKey,
    method: HttpMethod.DELETE,
    resourceUri: `/unsubscribes/${lemlistInput.emailOrDomainSegment({ value: email, label: 'Email' })}`,
  });
}

function campaignSegment(value: unknown): string {
  return lemlistInput.idSegment({ value, label: 'Campaign ID', prefix: 'cam' });
}

function asLeadList(body: unknown): { leads: unknown[]; count: number } {
  const leads = Array.isArray(body) ? body : body === undefined || body === null || body === '' ? [] : [body];
  return { leads, count: leads.length };
}

export const lemlistLeads = {
  getLeadsByEmail,
  leadCampaignId,
  createLeadInCampaign,
  updateLeadInCampaign,
  deleteLeadFromCampaign,
  setInterestInCampaign,
  setInterestEverywhere,
  setLeadPaused,
  writeLeadVariables,
  removeFromUnsubscribes,
  campaignSegment,
  asLeadList,
};
