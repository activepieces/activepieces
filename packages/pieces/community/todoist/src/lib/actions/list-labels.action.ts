import { createAction } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistLabelsClient } from '../common/client/labels-client';
import { todoistAuth } from '../..';

export const todoistListLabelsAction = createAction({
  auth: todoistAuth,
  name: 'todoist_list_labels',
  displayName: 'List Labels',
  description: "Lists all of the user's personal labels in Todoist.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists all of the user's personal Todoist labels (id, name, color, order, favorite). Use this to resolve a label name to its ID before updating, deleting, or getting a single label. For shared (workspace) labels use List Shared Labels instead; to filter by name client-side use Search Labels. Read-only and idempotent.",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const token = auth.access_token;
    assertNotNullOrUndefined(token, 'token');

    const labels = await todoistLabelsClient.list({ token });
    return { labels, count: labels.length };
  },
});
