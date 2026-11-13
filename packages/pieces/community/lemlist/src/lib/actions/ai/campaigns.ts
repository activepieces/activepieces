import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isRecord, lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { campaignItems } from '../../common/props';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

function campaignPath(value: unknown): string {
  return `/campaigns/${lemlistInput.idSegment({ value, label: 'Campaign ID', prefix: 'cam' })}`;
}

export const listCampaignsAction = createAction({
  auth: lemlistAuth,
  name: 'list_campaigns',
  classification: 'SEARCH',
  displayName: 'List Campaigns',
  description: 'Lists lemlist campaigns, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists lemlist campaigns newest first with ID, name, status and errors. Optional status filter (running, draft, paused, ended, archived, errors). Paged: Limit 1-100 (default 100) and Offset; has_more=true means call again with Offset + Limit. Read-only.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: ['running', 'draft', 'paused', 'ended', 'archived', 'errors'].map((value) => ({
          label: value,
          value,
        })),
      },
    }),
    limit: aiProps.limit({ max: 100, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.campaignPage,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/campaigns',
      query: {
        version: 'v2',
        limit,
        offset,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: propsValue.status ?? undefined,
      },
    });
    return lemlistResults.page({ items: campaignItems(body), offset, limit });
  },
});

export const getCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'get_campaign',
  classification: 'READ',
  displayName: 'Get Campaign',
  description: 'Returns one lemlist campaign.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one lemlist campaign by campaign ID (cam_...): name, status, creator and senders. Read-only.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId() },
  outputSchema: lemlistSchemas.campaignDetails,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: campaignPath(propsValue.campaign_id),
    });
  },
});

export const getCampaignStatsAction = createAction({
  auth: lemlistAuth,
  name: 'get_campaign_stats',
  classification: 'READ',
  displayName: 'Get Campaign Stats',
  description: 'Returns performance statistics of a campaign for a date range.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns counters for one campaign between Start Date and End Date (ISO 8601): leads launched/reached/opened/answered/interested, messages sent/bounced, opens, clicks, replies, meetings and per-step numbers. Read-only.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    start_date: Property.ShortText({ displayName: 'Start Date', description: 'ISO 8601 date, e.g. 2026-10-01.', required: true }),
    end_date: Property.ShortText({ displayName: 'End Date', description: 'ISO 8601 date, e.g. 2026-10-31.', required: true }),
  },
  outputSchema: lemlistSchemas.campaignStats,
  async run({ auth, propsValue }) {
    const startDate = lemlistInput.isoDate({ value: propsValue.start_date, label: 'Start Date' });
    const endDate = lemlistInput.isoDate({ value: propsValue.end_date, label: 'End Date' });
    if (Date.parse(startDate) > Date.parse(endDate)) {
      throw new Error('Start Date must be before End Date.');
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/v2${campaignPath(propsValue.campaign_id)}/stats`,
      query: { startDate, endDate },
    });
  },
});

export const getCampaignSequencesAction = createAction({
  auth: lemlistAuth,
  name: 'get_campaign_sequences',
  classification: 'READ',
  displayName: 'Get Campaign Sequences',
  description: 'Returns the sequences and steps of a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns every sequence of one campaign with its steps (step ID, index, type, delay in days, subject, message). Read-only; this piece does not edit sequences.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId() },
  outputSchema: lemlistSchemas.sequences,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `${campaignPath(propsValue.campaign_id)}/sequences`,
    });
    const sequences = Array.isArray(body)
      ? lemlistResults.records(body)
      : isRecord(body)
        ? Object.values(body).filter(isRecord)
        : [];
    return { sequences, count: sequences.length };
  },
});

export const listCampaignSchedulesAction = createAction({
  auth: lemlistAuth,
  name: 'list_campaign_schedules',
  classification: 'SEARCH',
  displayName: 'List Campaign Schedules',
  description: 'Lists the sending schedules of a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sending schedules attached to one campaign (timezone, start/end time, weekdays, seconds between emails). Read-only.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId() },
  outputSchema: lemlistSchemas.schedules,
  async run({ auth, propsValue }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `${campaignPath(propsValue.campaign_id)}/schedules/`,
    });
    const items = lemlistResults.listFrom({ body, key: 'schedules' });
    return { items, count: items.length };
  },
});

export const listSchedulesAction = createAction({
  auth: lemlistAuth,
  name: 'list_schedules',
  classification: 'SEARCH',
  displayName: 'List Schedules',
  description: 'Lists the sending schedules of the team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the team sending schedules (name, timezone, hours, weekdays), newest first. Limit 1-100 (default 100) and Offset for paging. Read-only.',
    idempotent: true,
  },
  props: {
    limit: aiProps.limit({ max: 100, fallback: 100 }),
    offset: aiProps.offset(),
  },
  outputSchema: lemlistSchemas.schedules,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 100;
    const offset = lemlistInput.boundedInt({ value: propsValue.offset, label: 'Offset', min: 0, max: 1_000_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/schedules',
      query: { limit, offset, sortBy: 'createdAt', sortOrder: 'desc' },
    });
    const items = lemlistResults.listFrom({ body, key: 'schedules' });
    return { items, count: items.length };
  },
});

export const createCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'create_campaign',
  classification: 'WRITE',
  displayName: 'Create Campaign',
  description: 'Creates a draft lemlist campaign. It is not started.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new draft lemlist campaign with an empty auto-generated sequence and default schedule. The campaign is never started by this action, so no email is sent. Returns the campaign ID (cam_...). Not idempotent: each run creates another campaign with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'IANA timezone of the schedule, e.g. Europe/Paris.',
      required: false,
    }),
  },
  outputSchema: lemlistSchemas.createdCampaign,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/campaigns',
      body: lemlistInput.compact({
        name: lemlistInput.requireText({ value: propsValue.name, label: 'Name' }),
        timezone: propsValue.timezone,
      }),
    });
  },
});

export const updateCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'update_campaign',
  classification: 'WRITE',
  displayName: 'Update Campaign',
  description: 'Updates the name and stop/tracking settings of a campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one campaign: name, stop-on-reply / meeting-booked / link-clicked rules and open/click/reply tracking switches. Each switch takes yes, no or unchanged; only the name and switches set to yes/no are sent, everything else keeps its current value. Idempotent.',
    idempotent: true,
  },
  props: {
    campaign_id: aiProps.campaignId(),
    name: Property.ShortText({ displayName: 'Name', required: false }),
    stopOnEmailReplied: aiProps.triState({ displayName: 'Stop on Email Replied', description: 'Stop the sequence for a lead who replies.' }),
    stopOnMeetingBooked: aiProps.triState({ displayName: 'Stop on Meeting Booked', description: 'Stop the sequence for a lead who books a meeting.' }),
    stopOnLinkClicked: aiProps.triState({ displayName: 'Stop on Link Clicked', description: 'Stop the sequence for a lead who clicks a link.' }),
    disableTrackOpen: aiProps.triState({ displayName: 'Disable Open Tracking', description: 'Turn off email open tracking.' }),
    disableTrackClick: aiProps.triState({ displayName: 'Disable Click Tracking', description: 'Turn off link click tracking.' }),
    disableTrackReply: aiProps.triState({ displayName: 'Disable Reply Tracking', description: 'Turn off reply tracking.' }),
  },
  outputSchema: lemlistSchemas.updatedCampaign,
  async run({ auth, propsValue }) {
    const body = lemlistInput.compact({
      name: propsValue.name,
      stopOnEmailReplied: lemlistInput.triState(propsValue.stopOnEmailReplied),
      stopOnMeetingBooked: lemlistInput.triState(propsValue.stopOnMeetingBooked),
      stopOnLinkClicked: lemlistInput.triState(propsValue.stopOnLinkClicked),
      disableTrackOpen: lemlistInput.triState(propsValue.disableTrackOpen),
      disableTrackClick: lemlistInput.triState(propsValue.disableTrackClick),
      disableTrackReply: lemlistInput.triState(propsValue.disableTrackReply),
    });
    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one setting to update.');
    }
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.PATCH,
      resourceUri: campaignPath(propsValue.campaign_id),
      body,
    });
  },
});

export const startCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'start_campaign',
  classification: 'WRITE',
  displayName: 'Start Campaign',
  description: 'Starts or resumes a campaign. This sends real emails and messages to its leads.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts or resumes one campaign. Running campaigns send real emails, LinkedIn and other messages to their leads on schedule, which cannot be recalled. Only call when the user explicitly asked to launch or resume this campaign. Idempotent: starting a running campaign leaves it running.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId() },
  outputSchema: lemlistSchemas.campaignState,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `${campaignPath(propsValue.campaign_id)}/start`,
    });
  },
});

export const pauseCampaignAction = createAction({
  auth: lemlistAuth,
  name: 'pause_campaign',
  classification: 'WRITE',
  displayName: 'Pause Campaign',
  description: 'Pauses a running campaign.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Pauses one running campaign so no more messages are sent; leads keep their place and Start Campaign resumes it. Idempotent.',
    idempotent: true,
  },
  props: { campaign_id: aiProps.campaignId() },
  outputSchema: lemlistSchemas.campaignState,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: `${campaignPath(propsValue.campaign_id)}/pause`,
    });
  },
});
