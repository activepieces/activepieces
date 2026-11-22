import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const getMemberActivity = createAction({
  auth: mailchimpAuth,
  name: 'get_member_activity',
  classification: 'READ',
  displayName: 'Get Member Activity',
  description: 'Get the recent activity feed of an audience member (opens, clicks, sends, signups and more).',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the most recent activity events for one member (list_id + email), newest first: campaign sends, opens, clicks, bounces, signups, notes and similar. Limit caps how many events come back (1-1000). Fails if the member is not in the audience. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['memberActivity'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the audience member.',
      required: true,
    }),
    count: Property.Number({
      displayName: 'Limit',
      description: 'How many recent events to return (1-1000). Default 50.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const email = mailchimpApi.requireText({ value: context.propsValue.email, label: 'Email Address' });
    const paging = mailchimpApi.readPaging({ count: context.propsValue.count, offset: 0, defaultCount: 50 });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<ActivityResponse>({
      method: HttpMethod.GET,
      path: `${mailchimpApi.memberPath({ listId, email })}/activity-feed`,
      queryParams: { count: paging.count },
      operation: 'get member activity',
    });
    const activity = body.activity ?? [];
    return {
      activity: activity.map((event) => ({
        activity_type: event.activity_type,
        created_at_timestamp: event.created_at_timestamp ?? null,
        campaign_id: event.campaign_id || null,
        campaign_title: event.campaign_title || null,
        link_clicked: event.link_clicked || null,
      })),
      total_items: body.total_items && body.total_items > 0 ? body.total_items : activity.length,
    };
  },
});

type ActivityResponse = {
  activity?: {
    activity_type: string;
    created_at_timestamp?: string;
    campaign_id?: string;
    campaign_title?: string;
    link_clicked?: string;
  }[];
  total_items?: number;
};
