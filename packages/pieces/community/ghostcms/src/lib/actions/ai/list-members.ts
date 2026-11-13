import { createAction, Property } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostListMembersOutputSchema } from '../../output-schemas';

export const ghostListMembers = createAction({
  auth: ghostAuth,
  name: 'ghost_list_members',
  outputSchema: ghostListMembersOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Members',
  description: 'List or search members.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists members with their labels, newsletters and status and pagination totals. Narrow with an NQL filter (status:paid, label:vip, subscribed:true) or a free-text Search on name and email. Use Get Member by Email for an exact email.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter('status:paid+label:vip'),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Free-text search on member name and email.',
      required: false,
    }),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('created_at desc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'members', {
      ...ghostCommon.listQuery(context.propsValue),
      search: context.propsValue.search?.trim(),
    });
  },
});
