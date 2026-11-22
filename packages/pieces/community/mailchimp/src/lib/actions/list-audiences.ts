import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

export const listAudiences = createAction({
  auth: mailchimpAuth,
  name: 'list_audiences',
  classification: 'SEARCH',
  displayName: 'List Audiences',
  description: 'List the audiences (lists) in your Mailchimp account with their member counts.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the audiences (lists) in the Mailchimp account, one page at a time, with ID, name and member counts. Use it to find the list_id that every member, segment and campaign action needs. Check has_more and raise offset to read the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['listAudiences'],
  props: {
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
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<ListsResponse>({
      method: HttpMethod.GET,
      path: '/lists',
      queryParams: { count: paging.count, offset: paging.offset },
      operation: 'list audiences',
    });
    const audiences = body.lists.map((list) => ({
      id: list.id,
      name: list.name,
      web_id: list.web_id,
      member_count: list.stats?.member_count ?? 0,
      unsubscribe_count: list.stats?.unsubscribe_count ?? 0,
      date_created: list.date_created ?? null,
    }));
    return {
      audiences,
      total_items: body.total_items,
      has_more: paging.offset + audiences.length < body.total_items,
    };
  },
});

type ListsResponse = {
  lists: {
    id: string;
    name: string;
    web_id: number;
    date_created?: string;
    stats?: { member_count?: number; unsubscribe_count?: number };
  }[];
  total_items: number;
};
