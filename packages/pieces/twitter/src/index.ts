
import { PieceAuth, Property, createPiece } from "@activepieces/pieces-framework";
import { createTweet } from "./lib/actions/create-tweet";
import { TwitterApi } from "twitter-api-v2";

const markdownDescription = `
If you don't have the crednetials down below, please follow these steps to obtain the required credentials:

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps) and click on your app settings.

2. Go to Keys and tokens tab.

3. Copy the following values from the "**Keys and tokens**" tab:

    - Next to **API key and secret**, click "Regenerate" and copy the following values:

        **Api Key**

        **Api Key Secret**

    - - Next to **Access token and secret**, click "Regenerate" and copy the following values:

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
