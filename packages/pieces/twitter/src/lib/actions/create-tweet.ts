import { Property, createAction } from "@activepieces/pieces-framework";
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from "../..";

export const createTweet = createAction({
    auth: twitterAuth,
    action: {
        name: "create-tweet",
        displayName: "Create Tweet",
        description: "Create a tweet",
        props: {
            text: Property.LongText({
                displayName: "Text",
                description: "The text of the tweet",
                required: true,
            }),
        },
        async run(context) {
            const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = context.auth;
            const userClient = new TwitterApi({
                appKey: consumerKey,
                appSecret: consumerSecret,
                accessToken: accessToken,
                accessSecret: accessTokenSecret,
            });

            return userClient.v2.tweet(context.propsValue.text);
        },
    },
});
