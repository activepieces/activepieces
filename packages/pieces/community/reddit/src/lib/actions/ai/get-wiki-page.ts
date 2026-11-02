import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetWikiPageOutputSchema } from '../../output-schemas';

export const redditGetWikiPage = createAction({
  auth: redditAuth,
  name: 'reddit_get_wiki_page',
  outputSchema: redditGetWikiPageOutputSchema,
  displayName: 'Get Wiki Page',
  description: 'Gets the content of a subreddit wiki page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a subreddit wiki page\'s markdown content and its latest revision (author, date, id). Page names come from List Wiki Pages; nested pages use slashes (e.g. "config/sidebar"). Needs the `wikiread` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
    page: Property.ShortText({ displayName: 'Page', description: 'Wiki page name, e.g. "index" or "faq".', required: true }),
  },
  async run({ auth, propsValue }) {
    const subreddit = redditApi.cleanSubreddit({ value: propsValue.subreddit });
    const page = propsValue.page.trim().replace(/^\/+|\/+$/g, '');
    const response = await redditApi.request<WikiPageResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${subreddit}/wiki/${page.split('/').map(encodeURIComponent).join('/')}`,
    });
    const data = response.data ?? {};
    return {
      subreddit,
      page,
      content_md: data.content_md ?? '',
      revision_id: data.revision_id ?? null,
      revision_date: data.revision_date ?? null,
      revision_by: data.revision_by?.data['name'] ?? null,
      may_revise: data.may_revise ?? null,
    };
  },
});

type WikiPageResponse = {
  data?: {
    content_md?: string;
    revision_id?: string;
    revision_date?: number;
    revision_by?: RedditThing;
    may_revise?: boolean;
  };
};
