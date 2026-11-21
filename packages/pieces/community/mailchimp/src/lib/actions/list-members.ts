import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import { mailchimpApi } from '../common/client';
import { mailchimpOutputSchemas } from '../common/output-schemas';

import { ApiMember } from '../common/client';

export const listMembers = createAction({
  auth: mailchimpAuth,
  name: 'list_members',
  classification: 'SEARCH',
  displayName: 'List Audience Members',
  description: 'List the members of an audience, optionally filtered by status or by when they last changed.',
  audience: 'both',
  aiMetadata: {
    description: 'Lists members of one audience (list_id) one page at a time, optionally filtered by status (subscribed, unsubscribed, cleaned, pending, transactional, archived) and by "changed since" time. Returns email, status, name, tags and merge fields per member. Check has_more and raise offset for the next page. To look up a single known email use Get Member instead. Read-only.',
    idempotent: true,
  },
  outputSchema: mailchimpOutputSchemas['memberList'],
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    status: Property.StaticDropdown<string>({
      displayName: 'Status',
      description: 'Only return members with this status.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Cleaned', value: 'cleaned' },
          { label: 'Pending', value: 'pending' },
          { label: 'Transactional', value: 'transactional' },
          { label: 'Archived', value: 'archived' },
        ],
      },
    }),
    since_last_changed: Property.DateTime({
      displayName: 'Changed Since',
      description: 'Only return members whose information changed after this time.',
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
    const listId = mailchimpApi.requireText({ value: context.propsValue.list_id, label: 'Audience' });
    const paging = mailchimpApi.readPaging({ count: context.propsValue.count, offset: context.propsValue.offset, defaultCount: 100 });
    const since = mailchimpApi.optionalText(context.propsValue.since_last_changed);
    if (since !== undefined && Number.isNaN(Date.parse(since))) {
      throw new Error('Changed Since must be a valid date and time.');
    }
    const client = mailchimpApi.createClient({ accessToken: context.auth.access_token });
    const body = await client.request<MembersResponse>({
      method: HttpMethod.GET,
      path: `/lists/${encodeURIComponent(listId)}/members`,
      queryParams: {
        count: paging.count,
        offset: paging.offset,
        status: mailchimpApi.optionalText(context.propsValue.status),
        since_last_changed: since === undefined ? undefined : new Date(since).toISOString(),
      },
      operation: 'list members',
    });
    const members = body.members.map((member) => mailchimpApi.toMemberSummary(member));
    return {
      members,
      total_items: body.total_items,
      has_more: paging.offset + members.length < body.total_items,
    };
  },
});

type MembersResponse = { members: ApiMember[]; total_items: number };
