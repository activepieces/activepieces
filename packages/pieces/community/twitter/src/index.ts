import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { TwitterApi } from 'twitter-api-v2';
import { createTweet } from './lib/actions/create-tweet';
import { createReply } from './lib/actions/create-reply';
import { xGetAuthenticatedUser } from './lib/actions/x-get-authenticated-user';

const markdownDescription = `To connect, create keys for your app in the X Developer Portal:

1. Open the [X Developer Portal](https://developer.x.com/en/portal/projects-and-apps) and select your app. It must belong to a Project.
2. On the **Settings** tab, under **User authentication settings**, click **Set up**. Choose **Read and write** for App permissions and **Native App** for Type of App, enter your website URL, and set the Callback URI to that URL followed by \`/redirect\`.
3. On the **Keys and tokens** tab, regenerate **API Key and Secret** and **Access Token and Secret**, and paste the four values below.

Do step 2 before step 3: an Access Token generated earlier keeps the old permission level.`;

export const twitterAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    consumerKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Found under Keys and tokens, next to API Key and Secret.',
      required: true,
    }),
    consumerSecret: Property.ShortText({
      displayName: 'API Key Secret',
      description: 'Found under Keys and tokens, next to API Key and Secret.',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description:
        'Found under Keys and tokens, next to Access Token and Secret.',
      required: true,
    }),
    accessTokenSecret: Property.ShortText({
      displayName: 'Access Token Secret',
      description:
        'Found under Keys and tokens, next to Access Token and Secret.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { consumerKey, consumerSecret, accessToken, accessTokenSecret } =
      auth;
    const userClient = new TwitterApi({
      appKey: consumerKey,
      appSecret: consumerSecret,
      accessToken: accessToken,
      accessSecret: accessTokenSecret,
    });
    try {
      await userClient.v2.me();
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Please make sure you have followed steps carefully and that your app is placed in a project.',
      };
    }
  },
  required: true,
});

export const twitter = createPiece({
  displayName: 'Twitter',
  description: 'Post tweets and replies on X, formerly Twitter.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/twitter.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["Abdallah-Alwarawreh","Salem-Alaa","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: twitterAuth,
  actions: [createTweet, createReply, xGetAuthenticatedUser],
  triggers: [],
});
