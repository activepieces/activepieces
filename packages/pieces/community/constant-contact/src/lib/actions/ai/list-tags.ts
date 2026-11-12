import { createAction } from '@activepieces/pieces-framework';
import { constantContactAuth } from '../../auth';
import { ccClient } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { tagsOutputSchema } from '../../common/output-schemas';

export const listTagsAiAction = createAction({
  auth: constantContactAuth,
  name: 'list_tags_ai',
  classification: 'SEARCH',
  displayName: 'List Tags',
  description: 'Lists the contact tags in the account, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Constant Contact tags (tag_id, name), one page at a time. Use it to find tag IDs for tagging actions and contact searches. Pass next_cursor to get the next page.',
    idempotent: true,
  },
  outputSchema: tagsOutputSchema,
  props: {
    include_count: aiProps.yesNo({ displayName: 'Include Contact Count', description: 'yes to return how many contacts have each tag.' }),
    limit: aiProps.limit({ max: 500, fallback: 50 }),
    cursor: aiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const page = await ccClient.listPage({
      accessToken: auth.access_token,
      path: '/contact_tags',
      key: 'tags',
      operation: 'list tags',
      query: {
        include_count: aiInput.yesNo({ value: propsValue.include_count, label: 'Include Contact Count' }),
        limit: aiInput.limit({ value: propsValue.limit, max: 500, fallback: 50 }),
        cursor: aiInput.cursor(propsValue.cursor),
      },
    });
    return { tags: page.items, next_cursor: page.nextCursor };
  },
});
