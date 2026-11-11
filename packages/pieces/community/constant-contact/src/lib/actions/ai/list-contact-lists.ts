import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { ccInput } from '../../common/props';
import { listsOutputSchema } from '../../common/output-schemas';

export const listContactListsAiAction = createAction({
  auth: constantContactAuth,
  name: 'list_contact_lists_ai',
  classification: 'SEARCH',
  displayName: 'List Contact Lists',
  description: 'Lists the contact lists in the account, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Constant Contact contact lists (list_id, name, member count), one page at a time; filter by exact name. Use it to find the list IDs other actions need. Pass next_cursor to get the next page.',
    idempotent: true,
  },
  outputSchema: listsOutputSchema,
  props: {
    name: aiProps.text({ displayName: 'Name', description: 'Optional exact list name to find a single list.' }),
    limit: aiProps.limit({ max: 500, fallback: 50 }),
    cursor: aiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const page = await ccClient.listPage({
      accessToken: auth.access_token,
      path: '/contact_lists',
      key: 'lists',
      operation: 'list contact lists',
      query: {
        name: ccInput.optionalText(propsValue.name),
        include_membership_count: 'all',
        limit: aiInput.limit({ value: propsValue.limit, max: 500, fallback: 50 }),
        cursor: aiInput.cursor(propsValue.cursor),
      },
    });
    return { lists: page.items, next_cursor: page.nextCursor };
  },
});
