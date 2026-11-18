import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUpdateChannelCategoriesOutputSchema } from '../../../output-schemas';

export const updateChannelCategoriesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_categories',
  outputSchema: mattermostUpdateChannelCategoriesOutputSchema,
  displayName: 'Update Sidebar Categories',
  description: 'Updates several of a user\'s sidebar categories at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates several sidebar categories of a user in one team in a single call, e.g. moving a channel from one category to another by giving both new channel lists; pass "me" for the connected account. Keys left out of a category stay as they are. Category IDs come from List Sidebar Categories. For one category use Update Sidebar Category.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    categories: Property.Array({
      displayName: 'Categories',
      description:
        'Category changes, each an object with "id" plus any of "display_name", "channel_ids" (the full ordered list for that category), "sorting" ("alpha", "recent" or "manual"), "muted" and "collapsed" (true/false). Example: [{"id": "abc", "channel_ids": ["c1", "c2"]}].',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, categories } = context.propsValue;
    if (categories.length === 0) {
      throw new Error('Categories is empty; give at least one category change.');
    }
    const path = `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories`;
    const current = await mattermostClient.request<{ categories: Record<string, unknown>[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path,
    });
    const merged = categories.map((change, index) => {
      if (!isRecord(change) || typeof change['id'] !== 'string') {
        throw new Error(`Categories item ${index} must be an object with a string "id".`);
      }
      const existing = current.categories.find((category) => category['id'] === change['id']);
      if (existing === undefined) {
        throw new Error(`Categories item ${index}: no sidebar category "${change['id']}" for this user and team.`);
      }
      return { ...existing, ...change };
    });
    const updated = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path,
      body: merged,
    });
    return { categories: updated, count: updated.length };
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
