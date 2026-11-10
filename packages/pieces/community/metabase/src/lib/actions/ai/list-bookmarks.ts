import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListBookmarksOutputSchema } from '../../output-schemas';

export const listBookmarksAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_bookmarks',
  outputSchema: metabaseListBookmarksOutputSchema,
  displayName: 'List Bookmarks',
  description: "List the connection user's bookmarks.",
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the items the connection's user has bookmarked (questions, dashboards, collections, documents).",
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const bookmarks = await metabaseApi.listBookmarks({
      auth,
    });
    return { bookmarks, count: bookmarks.length };
  },
});
