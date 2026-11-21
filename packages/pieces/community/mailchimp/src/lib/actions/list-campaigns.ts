import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

import { ApiCampaign } from '../common/client';

export const listCampaigns = createAction({
  auth: mailchimpAuth,
  name: 'list_campaigns',
  classification: 'SEARCH',
  displayName: 'List Campaigns',
  description: 'List campaigns, optionally filtered by status, type, audience or creation date.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists campaigns one page at a time, newest first, optionally filtered by status (save = draft, paused, schedule, sending, sent), type, audience (list_id) and "created since". Returns ID, title, subject, status, audience and send time. Check has_more and raise offset for more. Use the IDs with Get Campaign Content, Send Test Email, Replicate, Delete, Schedule or Get Campaign Stats. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['campaignList'],
  props: {
    status: Property.StaticDropdown<string>({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Draft', value: 'save' },
          { label: 'Paused', value: 'paused' },
          { label: 'Scheduled', value: 'schedule' },
          { label: 'Sending', value: 'sending' },
          { label: 'Sent', value: 'sent' },
        ],
      },
    }),
    type: Property.StaticDropdown<string>({
      displayName: 'Type',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Regular', value: 'regular' },
          { label: 'Plain Text', value: 'plaintext' },
          { label: 'A/B Test', value: 'absplit' },
          { label: 'RSS', value: 'rss' },
          { label: 'Variate', value: 'variate' },
        ],
      },
    }),
    list_id: mailchimpCommon.mailChimpOptionalListIdDropdown,
    since_create_time: Property.DateTime({
      displayName: 'Created Since',
      description: 'Only return campaigns created after this time.',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Limit',
      description: 'How many records to return (1-1000). Default 100.',
      required: false,
      defaultValue: 100,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many records to skip, for paging. Default 0.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const paging = mailchimpApi.readPaging({ count: context.propsValue.count, offset: context.propsValue.offset, defaultCount: 100 });
    const since = mailchimpApi.optionalText(context.propsValue.since_create_time);
    if (since !== undefined && Number.isNaN(Date.parse(since))) {
      throw new Error('Created Since must be a valid date and time.');
    }
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<CampaignsResponse>({
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams: {
        count: paging.count,
        offset: paging.offset,
        status: mailchimpApi.optionalText(context.propsValue.status),
        type: mailchimpApi.optionalText(context.propsValue.type),
        list_id: mailchimpApi.optionalText(context.propsValue.list_id),
        since_create_time: since === undefined ? undefined : new Date(since).toISOString(),
        sort_field: 'create_time',
        sort_dir: 'DESC',
      },
      operation: 'list campaigns',
    });
    const campaigns = body.campaigns.map((campaign) => mailchimpApi.toCampaignSummary(campaign));
    return {
      campaigns,
      total_items: body.total_items,
      has_more: paging.offset + campaigns.length < body.total_items,
    };
  },
});

type CampaignsResponse = { campaigns: ApiCampaign[]; total_items: number };
