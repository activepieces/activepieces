import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const getAudience = createAction({
  auth: mailchimpAuth,
  name: 'get_audience',
  classification: 'READ',
  displayName: 'Get Audience',
  description: 'Get the details and statistics of one audience (list).',
  audience: 'both',
  aiMetadata: {
    description: 'Returns one audience (list) by list_id: name, default sender, double opt-in setting, subscribe URL and statistics (members, unsubscribes, open and click rates). Get the list_id from List Audiences or Resolve Audience. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['getAudience'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
  },
  async run(context) {
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const list = await client.request<ListResponse>({
      method: HttpMethod.GET,
      path: `/lists/${encodeURIComponent(listId)}`,
      operation: 'get audience',
    });
    return {
      id: list.id,
      name: list.name,
      web_id: list.web_id,
      date_created: list.date_created ?? null,
      permission_reminder: list.permission_reminder ?? null,
      double_optin: list.double_optin ?? false,
      subscribe_url_short: list.subscribe_url_short ?? null,
      from_name: list.campaign_defaults?.from_name ?? null,
      from_email: list.campaign_defaults?.from_email ?? null,
      member_count: list.stats?.member_count ?? 0,
      unsubscribe_count: list.stats?.unsubscribe_count ?? 0,
      cleaned_count: list.stats?.cleaned_count ?? 0,
      campaign_count: list.stats?.campaign_count ?? 0,
      open_rate: list.stats?.open_rate ?? 0,
      click_rate: list.stats?.click_rate ?? 0,
      last_sub_date: list.stats?.last_sub_date || null,
    };
  },
});

type ListResponse = {
  id: string;
  name: string;
  web_id: number;
  date_created?: string;
  permission_reminder?: string;
  double_optin?: boolean;
  subscribe_url_short?: string;
  campaign_defaults?: { from_name?: string; from_email?: string };
  stats?: {
    member_count?: number;
    unsubscribe_count?: number;
    cleaned_count?: number;
    campaign_count?: number;
    open_rate?: number;
    click_rate?: number;
    last_sub_date?: string;
  };
};
