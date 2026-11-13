import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isLemlistStatus, lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistLeads } from '../../common/requests';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

const LEAD_FIELD_KEYS = Object.keys(leadFieldProps());

function leadFieldProps() {
  return {
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    companyName: Property.ShortText({ displayName: 'Company Name', required: false }),
    companyDomain: Property.ShortText({ displayName: 'Company Domain', required: false }),
    jobTitle: Property.ShortText({ displayName: 'Job Title', required: false }),
    linkedinUrl: Property.ShortText({ displayName: 'LinkedIn URL', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    icebreaker: Property.LongText({ displayName: 'Icebreaker', required: false }),
  };
}

export const listCampaignLeadsAction = createAction({
  auth: lemlistAuth,
  name: 'list_campaign_leads',
  classification: 'SEARCH',
  displayName: 'List Campaign Leads',
  description: 'Lists the leads of a campaign, optionally by state.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists leads of one campaign (lead ID, contact ID, state), optionally only those in a state such as scanned, contacted, interested or notInterested. Returns at most Limit leads (1-500, default 100); Page with Offset (default 0); has_more=true means another page may exist, so call again with offset + limit. Read-only.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    state: Property.ShortText({
      displayName: 'State',
      description: 'Lead state filter, e.g. scanned, contacted, interested, notInterested.',
      required: false,
    }),
    limit: aiProps.limit({ max: 500, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.campaignLeads,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 500 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(propsValue.campaign_id)}/leads/`,
      query: { state: lemlistInput.optionalText(propsValue.state), limit, offset },
    });
    return lemlistResults.page({ items: lemlistResults.listFrom({ body }), offset, limit });
  },
});

export const createLeadInCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'create_lead_in_campaign',
  classification: 'WRITE',
  displayName: 'Create Lead in Campaign',
  description: 'Creates a lead in a campaign. Runs no paid enrichment.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new lead (email plus optional name, company, job title, LinkedIn, phone, icebreaker) in one campaign and returns its lead ID (lea_...). If the campaign is running, the lead enters the sequence and may be emailed. Uses no enrichment credits (see Enrich Lead). With Deduplicate on, it is refused when the contact is already in another campaign. Not idempotent: a second run fails or creates a duplicate.',
    idempotent: false,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    email: aiProps.leadEmail(),
    ...leadFieldProps(),
    deduplicate: Property.Checkbox({
      displayName: 'Deduplicate',
      description: 'Refuse the lead when the contact is already in another campaign.',
      required: false,
    }),
  },
  outputSchema: lemlistSchemas.createdLead,
  async run({ auth, propsValue }) {
    const { campaign_id, email, deduplicate } = propsValue;
    const fields = lemlistInput.pick({ record: propsValue, keys: LEAD_FIELD_KEYS });
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(campaign_id)}/leads/`,
      query: { deduplicate: deduplicate === true ? true : undefined },
      body: {
        ...lemlistInput.compact(fields),
        email: lemlistInput.email({ value: email, label: 'Lead Email' }),
      },
    });
  },
});

export const getLeadByEmailAction = createAction({
  auth: lemlistAuth,
  name: 'get_lead_by_email',
  classification: 'READ',
  displayName: 'Get Lead by Email',
  description: 'Finds the leads of one email across campaigns.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns every lead with this email (one per campaign) with lead ID, state, variables and campaign; optional Campaign ID keeps only that campaign. found=false when there is none. Read-only.',
    idempotent: true,
  },
  props: {
    email: aiProps.leadEmail(),
    campaign_id: aiProps.campaignId(false),
  },
  outputSchema: lemlistSchemas.leadsByEmail,
  async run({ auth, propsValue }) {
    const email = lemlistInput.email({ value: propsValue.email, label: 'Lead Email' });
    const campaignId = lemlistInput.optionalText(propsValue.campaign_id);
    const leads = await lemlistLeads.getLeadsByEmail({ apiKey: auth.secret_text, email });
    const matching =
      campaignId === undefined ? leads : leads.filter((lead) => lemlistLeads.leadCampaignId(lead) === campaignId);
    return {
      found: matching.length > 0,
      message: matching.length > 0 ? `Found ${matching.length} lead(s).` : `No lead found for ${email}.`,
      leads: matching,
    };
  },
});

export const updateCampaignLeadAction = createAction({
  auth: lemlistAuth,
  name: 'update_campaign_lead',
  classification: 'WRITE',
  displayName: 'Update Campaign Lead',
  description: 'Updates fields of a lead in a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates a lead in one campaign, found by lead ID (lea_...) or email. Only the fields you pass are changed; at least one is required. Changing company fields also changes the shared company record. Idempotent.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    lead: aiProps.leadIdOrEmail(),
    ...leadFieldProps(),
  },
  outputSchema: lemlistSchemas.leadWithWarnings,
  async run({ auth, propsValue }) {
    const { campaign_id, lead } = propsValue;
    const fields = lemlistInput.pick({ record: propsValue, keys: LEAD_FIELD_KEYS });
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(campaign_id)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: lead, label: 'Lead' })}`,
      body: requireSomeFields(fields),
    });
  },
});

function requireSomeFields(fields: Record<string, unknown>): Record<string, unknown> {
  const body = lemlistInput.compact(fields);
  if (Object.keys(body).length === 0) {
    throw new Error('Provide at least one field to update.');
  }
  return body;
}

export const deleteLeadFromCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'delete_lead_from_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead from Campaign',
  description: 'Deletes a lead from a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a lead (lead ID or email) from one campaign; its progress in that campaign is lost and cannot be restored. The contact itself is kept. Returns alreadyRemoved=true when the lead was not in the campaign, so a retry is safe.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    lead: aiProps.leadIdOrEmail(),
  },
  outputSchema: lemlistSchemas.deletedLead,
  async run({ auth, propsValue }) {
    try {
      const lead = await lemlistApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.DELETE,
        resourceUri: `/campaigns/${lemlistLeads.campaignSegment(propsValue.campaign_id)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
        query: { action: 'remove' },
      });
      return { deleted: true, alreadyRemoved: false, lead };
    } catch (error) {
      if (isLemlistStatus({ error, status: 404 })) {
        return { deleted: false, alreadyRemoved: true, lead: null };
      }
      throw error;
    }
  },
});

export const unsubscribeLeadFromCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'unsubscribe_lead_from_campaign',
  classification: 'DESTRUCTIVE',
  displayName: 'Unsubscribe Lead from Campaign',
  description: 'Unsubscribes a lead from one campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unsubscribes a lead (lead ID or email) from one campaign: it gets no more messages from that campaign and this cannot be undone here. Other campaigns are not affected; use Add Unsubscribe to block an email everywhere.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    lead: aiProps.leadIdOrEmail(),
  },
  outputSchema: lemlistSchemas.unsubscribedLead,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(propsValue.campaign_id)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
    });
  },
});

export const pauseLeadInCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'pause_lead_in_campaign',
  classification: 'WRITE',
  displayName: 'Pause Lead in Campaign',
  description: 'Pauses a lead in one campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pauses a lead (lead ID or email) in one campaign so it gets no more messages there until resumed. Returns the paused leads. Idempotent.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId(), lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.leadState,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/pause/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
      query: { campaignId: decodeURIComponent(lemlistLeads.campaignSegment(propsValue.campaign_id)) },
    });
    return lemlistLeads.asLeadList(body);
  },
});

export const pauseLeadEverywhereAction = createAction({
  auth: lemlistAuth,
  name: 'pause_lead_everywhere',
  classification: 'WRITE',
  displayName: 'Pause Lead in All Campaigns',
  description: 'Pauses a lead in every campaign.',
  audience: 'ai',
  aiMetadata: {
    description: 'Pauses a lead (lead ID or email) in every campaign it belongs to. Returns the paused leads. Idempotent.',
    idempotent: true,
  },
  props: { lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.leadState,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/pause/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
    });
    return lemlistLeads.asLeadList(body);
  },
});

export const resumeLeadInCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'resume_lead_in_campaign',
  classification: 'WRITE',
  displayName: 'Resume Lead in Campaign',
  description: 'Resumes a paused lead in one campaign. It can be emailed right away.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resumes a paused lead (lead ID or email) in one campaign. If the campaign is running the lead can receive real messages right away. Idempotent.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId(), lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.leadState,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/start/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
      query: { campaignId: decodeURIComponent(lemlistLeads.campaignSegment(propsValue.campaign_id)) },
    });
    return lemlistLeads.asLeadList(body);
  },
});

export const resumeLeadEverywhereAction = createAction({
  auth: lemlistAuth,
  name: 'resume_lead_everywhere',
  classification: 'WRITE',
  displayName: 'Resume Lead in All Campaigns',
  description: 'Resumes a paused lead in every campaign. It can be emailed right away.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Resumes a paused lead (lead ID or email) in every campaign it belongs to; running campaigns can message it right away. Idempotent.',
    idempotent: true,
  },
  props: { lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.leadState,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/start/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}`,
    });
    return lemlistLeads.asLeadList(body);
  },
});

export const launchLeadAction = createAction({
  auth: lemlistAuth,
  name: 'launch_lead',
  classification: 'WRITE',
  displayName: 'Launch Lead',
  description: 'Launches a lead waiting for review. Its campaign can then email it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Launches one lead (lea_...) that is waiting for review, so its campaign starts sending it real messages. Fails if the campaign has step errors or no sender. Needs an emailPro plan or higher. Only call when the user asked to launch this lead. Idempotent: an already launched lead stays launched.',
    idempotent: true,
  },
  props: { lead_id: aiProps.leadId() },
  outputSchema: lemlistSchemas.ok,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/leads/review/${lemlistInput.idSegment({ value: propsValue.lead_id, label: 'Lead ID', prefix: 'lea' })}`,
    });
  },
});

export const markLeadInterestedInCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'mark_lead_interested_in_campaign',
  classification: 'WRITE',
  displayName: 'Mark Lead Interested in Campaign',
  description: 'Marks a lead as interested in one campaign.',
  audience: 'ai',
  aiMetadata: {
    description: 'Marks a lead (lead ID or email) as interested in one campaign. Returns the updated lead. Idempotent.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId(), lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.lead,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(propsValue.campaign_id)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}/interested`,
    });
  },
});

export const markLeadNotInterestedInCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'mark_lead_not_interested_in_campaign',
  classification: 'WRITE',
  displayName: 'Mark Lead Not Interested in Campaign',
  description: 'Marks a lead as not interested in one campaign.',
  audience: 'ai',
  aiMetadata: {
    description: 'Marks a lead (lead ID or email) as not interested in one campaign. Returns the updated lead. Idempotent.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId(), lead: aiProps.leadIdOrEmail() },
  outputSchema: lemlistSchemas.lead,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `/campaigns/${lemlistLeads.campaignSegment(propsValue.campaign_id)}/leads/${lemlistInput.leadIdOrEmailSegment({ value: propsValue.lead, label: 'Lead' })}/notinterested`,
    });
  },
});

export const updateLeadVariablesAction = createAction({
  auth: lemlistAuth,
  name: 'update_lead_variables',
  classification: 'WRITE',
  displayName: 'Update Lead Variables',
  description: 'Updates values of existing custom variables on a lead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sets new values for custom variables that already exist on a lead (lea_...). Pass name/value pairs; values are sent in the request body. Use Add Custom Variables on Lead to create new names. company-prefixed names change the shared company record. Idempotent.',
    idempotent: true,
  },
  props: {
    lead_id: aiProps.leadId(),
    variables: Property.Object({
      displayName: 'Variables',
      description: 'Variable names and their new values.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.variables,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      resourceUri: `/leads/${lemlistInput.idSegment({ value: propsValue.lead_id, label: 'Lead ID', prefix: 'lea' })}/variables`,
      body: lemlistInput.stringRecord({ value: propsValue.variables, label: 'Variables' }),
    });
  },
});

export const eraseLeadVariablesAction = createAction({
  auth: lemlistAuth,
  name: 'erase_lead_variables',
  classification: 'DESTRUCTIVE',
  displayName: 'Erase Lead Variables',
  description: 'Erases the values of custom variables on a lead.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Erases the values of the named custom variables on a lead (lea_...); the variable names stay. Erased values cannot be recovered. companyDomain cannot be erased. Idempotent.',
    idempotent: true,
  },
  props: {
    lead_id: aiProps.leadId(),
    variable_names: Property.Array({
      displayName: 'Variable Names',
      description: 'Names of the variables whose values to erase.',
      required: true,
    }),
  },
  outputSchema: lemlistSchemas.variables,
  async run({ auth, propsValue }) {
    const names = lemlistInput.stringList({ value: propsValue.variable_names, label: 'Variable Names' });
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.DELETE,
      resourceUri: `/leads/${lemlistInput.idSegment({ value: propsValue.lead_id, label: 'Lead ID', prefix: 'lea' })}/variables`,
      query: Object.fromEntries(names.map((name) => [name, ''])),
    });
  },
});
