import { createAction, Property } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabListPage } from '../../common/client';
import { gitlabProps, optionalText, pagingInput } from '../../common/props';
import { userListOutputSchema } from '../../output-schemas';

export const listUsersAction = createAction({
  auth: gitlabAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'Searches users by name, username or public email.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Searches GitLab users by name, username or public email, or finds one user by exact username. Use it to turn a username into the numeric user ID other actions need. Set Search or Username: without either gitlab.com returns an unhelpful list of arbitrary users. Returns one page plus nextPage/hasMore.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Name, username or public email.',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'Exact username, without @.',
      required: false,
    }),
    page: gitlabProps.page(),
    perPage: gitlabProps.perPage(),
  },
  outputSchema: userListOutputSchema,
  async run({ auth, propsValue }) {
    const search = optionalText(propsValue.search);
    const username = optionalText(propsValue.username)?.replace(/^@/, '');
    if (search === undefined && username === undefined) {
      throw new Error('Set Search or Username.');
    }
    return gitlabListPage({
      auth,
      path: '/users',
      query: { search, username },
      ...pagingInput({ page: propsValue.page, perPage: propsValue.perPage }),
    });
  },
});
