import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, tryCatch } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditListSavedCategoriesOutputSchema } from '../../output-schemas';

export const redditListSavedCategories = createAction({
  auth: redditAuth,
  name: 'reddit_list_saved_categories',
  outputSchema: redditListSavedCategoriesOutputSchema,
  displayName: 'List Saved Categories',
  description: 'Lists the categories you use for saved items.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists your saved-item categories, for the Category input of Save Post or Comment. Categories are a Reddit Premium feature, so the list is empty for other accounts. Needs the `save` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data: response, error } = await tryCatch(() =>
      redditApi.request<{ categories?: unknown[] }>({ auth, method: HttpMethod.GET, path: '/api/saved_categories' }),
    );
    if (error && !error.message.includes('404')) {
      throw error;
    }
    const categories = response?.categories ?? [];
    return { categories, count: categories.length };
  },
});
