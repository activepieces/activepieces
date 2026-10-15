import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostProps } from '../../common/ai-props';
import { ghostCommon } from '../../common/client';
import { ghostResource } from '../../common/resources';
import { ghostListUsersOutputSchema } from '../../output-schemas';

export const ghostListUsers = createAction({
  auth: ghostAuth,
  name: 'ghost_list_users',
  outputSchema: ghostListUsersOutputSchema,
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'List staff users such as authors and editors.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists staff users (owner, admins, editors, authors, contributors), not members, with their roles and post counts. Use it to find the author IDs that Create Post and Update Post accept.',
    idempotent: true,
  },
  props: {
    filter: ghostProps.filter('status:active'),
    limit: ghostProps.limit,
    page: ghostProps.page,
    order: ghostProps.order('name asc'),
  },
  async run(context) {
    return ghostResource.list(context.auth, 'users', {
      ...ghostCommon.listQuery(context.propsValue),
      include: 'roles,count.posts',
    });
  },
});
