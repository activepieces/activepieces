import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { TwitterApi } from 'twitter-api-v2';
import { createTweet } from './lib/actions/create-tweet';
import { createReply } from './lib/actions/create-reply';

const markdownDescription = `
If you don't have the credentials down below, please follow these steps to obtain the required credentials:

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps) and click on your app settings.

2. Under the **Settings** tab then under **User authentication settings** section, click "Set up".

3. **This step must be completed before generating the keys**, check on **Read and write** for "App permissions" and **Native App** for "Type of App", fill in your website url and let the **Callback URI / Redirect URL** be **(your_website_url)/redirect** .

4. Go back to your app settings page and click the **Keys and tokens** tab.

5. Next to **API key and secret**, click "Regenerate" and copy the following values to the inputs below:

        **Api Key**

        **Api Key Secret**

6. Next to **Access token and secret**, click "Regenerate" and copy the following values to the inputs below:

        **Access Token**

        **Access Token Secret**


`;

export const twitterAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    consumerKey: Property.ShortText({
      displayName: 'Api Key',
      description: 'The api key',
      required: true,
    }),
    consumerSecret: Property.ShortText({
      displayName: 'Api Key Secret',
      description: 'The api key secret',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'The access token',
      required: true,
    }),
    accessTokenSecret: Property.ShortText({
      displayName: 'Access Token Secret',
      description: 'The access token secret',
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
  description: 'Social media platform with over 500 million user',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/twitter.png',
  categories: [PieceCategory.COMMUNICATION],
  authors: ["Abdallah-Alwarawreh","Salem-Alaa","kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  auth: twitterAuth,
  actions: [createTweet, createReply],
  triggers: [],
});
