
import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { createTweet } from "./lib/actions/create-tweet";
import { TwitterApi } from "twitter-api-v2";

const markdownDescription = `
The steps to obtain the required credentials:

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps) and create a new app.

2. Make sure your app is placed in a project (it won't work otherwise).

3. In your app, go to Settings -> User authentication set up -> Update permission to **Read and Write** -> Fill **https://activepieces.com/redirect** in Redirect / Website Url.

4. Go to Keys and tokens tab.

5. Copy the following values from the **Keys and tokens** tab:

    - Click on **API key and secret** and copy the following values:

        **Api Key**

        **Api Key Secret**

    - Click on **Access token and secret** and copy the following values:

        **Access Token**

        **Access Token Secret**
`

export const twitterAuth = PieceAuth.CustomAuth({

    description: markdownDescription,
    props: {
        consumerKey: Property.ShortText({
            displayName: "Api Key",
            description: "The api key",
            required: true,
        }),
        consumerSecret: Property.ShortText({
            displayName: "Api Key Secret",
            description: "The api key secret",
            required: true,
        }),
        accessToken: Property.ShortText({
            displayName: "Access Token",
            description: "The access token",
            required: true,
        }),
        accessTokenSecret: Property.ShortText({
            displayName: "Access Token Secret",
            description: "The access token secret",
            required: true,
        }),
    },
    validate: async ({ auth }) => {
        const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = auth;
        const userClient = new TwitterApi({
            appKey: consumerKey,
            appSecret: consumerSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });
        try {
            await userClient.v2.me();
            return { valid: true };
        }
        catch (e) {
            return {
                valid: false,
                error: 'Please make sure you have followed steps carefully and that your app is placed in a project.'
            };
        }
    },
    required: true,
})

export const twitter = createPiece({
    displayName: "Twitter",
    minimumSupportedRelease: '0.5.0',
    logoUrl: "https://cdn.activepieces.com/pieces/twitter.png",
    authors: ["abuaboud", "Abdallah-Alwarawreh"],
    auth: twitterAuth,
    actions: [createTweet],
    triggers: [],
});
