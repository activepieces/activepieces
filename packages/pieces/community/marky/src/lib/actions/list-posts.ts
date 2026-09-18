import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { markyAuth } from '../auth';
import { markyCommon } from '../common/client';
import { markyProps } from '../common/props';

export const listPostsAction = createAction({
  auth: markyAuth,
  name: 'list_posts',
  displayName: 'List Posts',
  description: 'List the posts of a Marky business, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'List a business\'s posts newest first, optionally filtered by status or by a keyword matched against captions and attached media. Returns one page plus a cursor — pass the returned cursor back to read the next page. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    businessId: markyProps.businessId,
    status: markyProps.postStatusFilter,
    search: Property.ShortText({
      displayName: 'Search',
      description:
        "Only return posts whose caption, title or attached media description contains this text.",
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many posts to return per page, between 1 and 100.',
      required: false,
      defaultValue: 20,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: "The 'next' value returned by a previous run, to read the following page.",
      required: false,
    }),
  },
  async run(context) {
    const { businessId, status, search, limit, cursor } = context.propsValue;

    const queryParams: QueryParams = {
      ...(status ? { status } : {}),
      ...(search ? { q: search } : {}),
      ...(limit ? { limit: String(limit) } : {}),
      ...(cursor ? { cursor } : {}),
    };

    const response = await markyCommon.apiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/businesses/${businessId}/posts`,
      queryParams,
    });

    return response.body;
  },
});
