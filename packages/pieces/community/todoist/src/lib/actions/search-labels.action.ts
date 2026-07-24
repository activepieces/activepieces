import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistSearchLabelsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_search_labels',
  displayName: 'Search Labels',
  description: 'Searches personal labels by name in Todoist.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Finds the user's personal Todoist labels whose name contains the given query (case-insensitive substring match), evaluated client-side over all labels. Use to resolve a partial or fuzzy name to label records when you do not know the exact name; use List Labels to fetch every label, or Get Label when you already have an ID. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "Text to match against label names, case-insensitively (e.g. 'work').",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const { query } = propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(query, 'query');

    const labels = await todoistLabelsClient.list({ token });
    const needle = query.toLowerCase();
    const matched = labels.filter((label) =>
      label.name.toLowerCase().includes(needle),
    );
    return { labels: matched, count: matched.length };
  },
});
