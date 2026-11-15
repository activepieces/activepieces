import { createAction, Property } from '@activepieces/pieces-framework';
import { buildPath, makeRequest, paginatedResult } from '../common';
import { pinterestAuth } from '../common/auth';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { listUserSummariesActionOutputSchema } from '../output-schemas';

export const listFollowing = createAction({
  auth: pinterestAuth,
  name: 'listFollowing',
  classification: 'READ',
  outputSchema: listUserSummariesActionOutputSchema,
  displayName: 'List Following',
  description: 'List the accounts the connected account follows.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the accounts the connected account follows, returning each username with its follower count. Use it to check whether the account already follows someone; use List Followers for the other direction and List Followed Boards for boards rather than people. Pages through an opaque bookmark cursor. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    feed_type: Property.StaticDropdown({
      displayName: 'Feed Type',
      required: false,
      description:
        'Which followees to keep. Pinterest defaults to all of them.',
      options: {
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Ranked', value: 'RANKED' },
          { label: 'Creators Only', value: 'CREATOR_ONLY' },
          { label: 'Ranked Creators Only', value: 'RANKED_CREATOR_ONLY' },
        ],
      },
    }),
    page_size: Property.Number({
      displayName: 'Page Size',
      required: false,
      description: 'Accounts per page (1-250, Pinterest defaults to 25).',
    }),
    bookmark: Property.ShortText({
      displayName: 'Bookmark',
      required: false,
      description:
        'Opaque cursor returned by a previous call; omit to read the first page.',
    }),
  },
  async run({ auth, propsValue }) {
    const { feed_type, page_size, bookmark } = propsValue;

    const response = await makeRequest(
      getAccessTokenOrThrow(auth),
      HttpMethod.GET,
      buildPath('/user_account/following', { feed_type, page_size, bookmark })
    );

    return paginatedResult(response);
  },
});
