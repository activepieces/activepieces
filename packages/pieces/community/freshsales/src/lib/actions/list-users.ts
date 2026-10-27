import { createAction } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesProps } from '../common/props';
import { listUsersOutputSchema } from '../output-schemas';

export const listUsers = createAction({
  auth: freshsalesAuth,
  name: 'list_users',
  displayName: 'List Users',
  description: 'List Freshsales users (owners) with their IDs',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists all Freshsales users who can own records, with id, name and email. Use it to resolve a person name or email to the Owner ID needed by create and update tools.',
    idempotent: true,
  },
  outputSchema: listUsersOutputSchema,
  props: {
  },
  async run(context) {
    const items = await freshsalesProps.fetchSelector({
      auth: context.auth,
      path: '/api/selector/owners',
    });
    return {
      users: items.map((item) => ({ id: item.id, name: item.name, email: item.email ?? null })),
    };
  },
});
