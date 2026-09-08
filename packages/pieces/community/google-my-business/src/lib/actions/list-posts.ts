import { HttpMethod, httpClient, propsValidation } from '@activepieces/pieces-common';
import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import * as z from 'zod/mini';
import { googleAuth } from '../..';
import { listPostsActionOutputSchema } from '../output-schemas';
import { googleBusinessCommon } from '../common/common';
import { localPostUtils } from '../common/local-post';

export const listPosts = createAction({
  name: 'list-posts',
  outputSchema: listPostsActionOutputSchema,
  classification: 'READ',
  displayName: 'List Posts',
  description: 'Lists the posts of a specified location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the local posts published to a Google Business Profile location, newest first, following pagination up to Maximum Results. Use to read existing posts or to find a post name for Get, Update or Delete Post. Read-only and safe to repeat.',
    idempotent: true,
  },
  auth: googleAuth,
  props: {
    account: googleBusinessCommon.account,
    location: googleBusinessCommon.location,
    maxResults: Property.Number({
      displayName: 'Maximum Results',
      description:
        'Stop after this many posts. Google returns at most 100 per request, so larger values are fetched over several requests.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(ctx) {
    const { account, location, maxResults } = ctx.propsValue;

    await propsValidation.validateZod(ctx.propsValue, {
      maxResults: z.optional(z.number().check(z.gte(1))),
    });

    const limit = maxResults ?? DEFAULT_MAX_RESULTS;
    const localPosts: unknown[] = [];
    let pageToken: string | undefined;

    do {
      const remaining = limit - localPosts.length;
      const response = await httpClient.sendRequest<ListLocalPostsResponse>({
        url: `${localPostUtils.baseUrl}/${account}/${location}/localPosts`,
        method: HttpMethod.GET,
        headers: {
          Authorization: `Bearer ${ctx.auth.access_token}`,
        },
        queryParams: {
          pageSize: String(Math.min(remaining, MAX_PAGE_SIZE)),
          ...(isNil(pageToken) ? {} : { pageToken }),
        },
      });

      localPosts.push(...(response.body.localPosts ?? []));
      pageToken = response.body.nextPageToken;
    } while (!isNil(pageToken) && localPosts.length < limit);

    return {
      localPosts,
      ...(isNil(pageToken) ? {} : { nextPageToken: pageToken }),
    };
  },
});

const DEFAULT_MAX_RESULTS = 100;
const MAX_PAGE_SIZE = 100;

type ListLocalPostsResponse = {
  localPosts?: unknown[];
  nextPageToken?: string;
};
