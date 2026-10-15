import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListWikiPagesOutputSchema } from '../../output-schemas';

export const redditListWikiPages = createAction({
  auth: redditAuth,
  name: 'reddit_list_wiki_pages',
  outputSchema: redditListWikiPagesOutputSchema,
  displayName: 'List Wiki Pages',
  description: 'Lists the wiki pages of a subreddit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the names of a subreddit\'s wiki pages (e.g. "index", "faq"); read one with Get Wiki Page. Fails with 403 or 404 when the wiki is disabled or private. Needs the `wikiread` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<{ data?: string[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/wiki/pages`,
    });
    const pages = response.data ?? [];
    return { pages, count: pages.length };
  },
});
