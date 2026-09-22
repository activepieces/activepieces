import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listUserSummariesActionOutputSchema } from '../output-schemas';

export const listFollowers = createAction({
  auth: pinterestAuth,
  name: 'listFollowers',
  classification: 'READ',
  outputSchema: listUserSummariesActionOutputSchema,
  displayName: 'List Followers',
  description: 'List the accounts following the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the accounts that follow the connected account, newest first. Pinterest returns only a username and account type per follower, so use Get User Account for richer profile data. Use List Following for the accounts this account follows instead. Pages through an opaque bookmark cursor, so a large audience needs several calls. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Followers per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/followers', { page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
