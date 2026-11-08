import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioListSpaceMembersOutputSchema } from '../../../output-schemas';

export const listSpaceMembersAction = createAction({
  auth: podioAuth,
  name: 'podio_list_space_members',
  outputSchema: podioListSpaceMembersOutputSchema,
  displayName: 'List Space Members',
  description: 'Lists a page of space members, filtered by member type or a search term.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists one page of the members of a space with their profile, role, employee flag and grant count, optionally filtered by member type or a search term; page with Offset. Use it to find user ids for the other space member actions. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    memberType: podioAiProps.choice({ required: false, displayName: 'Member Type', description: 'Only return members of this type.', values: ['employee', 'external', 'admin', 'regular', 'light', 'guest'] }),
    query: podioAiProps.text({ required: false, displayName: 'Search', description: 'A search term to match members against.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of members to return. Defaults to 100.' }),
    offset: podioAiProps.offset({ required: false }),
  },
  async run({ auth, propsValue }) {
    const members = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/space/${propsValue.spaceId}/member/v2/`,
      query: podioUtils.query({ values: { member_type: propsValue.memberType, query: propsValue.query, limit: propsValue.limit ?? 100, offset: propsValue.offset } }),
    });
    return { members, count: members.length };
  },
});
