import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceAuth, OAuth2AuthorizationMethod, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { retrieveRedditPost } from './lib/actions/retrieve-reddit-post';
import { getRedditPostDetails } from './lib/actions/get-reddit-post-details';
import { createRedditPost } from './lib/actions/create-reddit-post';
import { createRedditComment } from './lib/actions/create-reddit-comment';
import { fetchPostComments} from './lib/actions/fetch-post-comments';
import { editRedditPost } from './lib/actions/edit-reddit-post';
import { editRedditComment } from './lib/actions/edit-reddit-comment';
import { deleteRedditPost } from './lib/actions/delete-reddit-post';
import { deleteRedditComment } from './lib/actions/delete-reddit-comment';
import { PieceCategory } from '@activepieces/shared';
import { OAuth2GrantType } from '@activepieces/shared';

const markdown = `
To obtain your Reddit API credentials:

1. Go to https://www.reddit.com/prefs/apps.
2. Click "create another app..." at the bottom.
3. Select "script" as the app type.
4. Fill in the required information:
   - name: Your app name
   - description: Brief description
   - about url: Can be left blank
   - redirect uri: as shown in Redirect URL field
5. Click "create app".
6. Note down the client ID (under the app name) and client secret.
`;

export const redditAuth = PieceAuth.OAuth2({
  description: markdown,
  authUrl: 'https://www.reddit.com/api/v1/authorize',
  tokenUrl: 'https://www.reddit.com/api/v1/access_token',
  required: true,
  scope: ['identity', 'read', 'submit', 'edit', 'history', 'flair'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  extra: {
    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
    responseType: 'code'
  }
});

export const reddit = createPiece({
  displayName: 'Reddit',
  description: 'Interact with Reddit - fetch and submit posts.',
  logoUrl: 'https://cdn.activepieces.com/pieces/reddit.png',
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['bhaviksingla1403'],
  auth: redditAuth,
  actions: [
    retrieveRedditPost,
    getRedditPostDetails,
    createRedditPost,
    createRedditComment,
    fetchPostComments,
    editRedditPost,
    editRedditComment,
    deleteRedditPost,
    deleteRedditComment,
    createCustomApiCallAction({
      auth: redditAuth,
      baseUrl: () => {
        return 'https://oauth.reddit.com';
      },
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
          'User-Agent': 'ActivePieces/1.0.0'
        };
      },
    }),
  ],
  triggers: [],
});
