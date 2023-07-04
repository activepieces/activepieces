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
            image: Property.File({
                displayName: "Media",
                description: "The image, video or GIF url or base64 to attach to the tweet",
                required: false,
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

            const media = context.propsValue.image;
            if (media) {
                console.log(`Uploading media to Twitter...`);
                const uploaded = await userClient.v1.uploadMedia(Buffer.from(media.base64, "base64"), {
                    mimeType: 'image/png',
                    target: 'tweet'
                });
                console.log(`Uploaded media to Twitter: ${uploaded}`);
                return userClient.v2.tweet(context.propsValue.text, {
                    media: {
                        media_ids: [uploaded]
                    }
                });
            } else {
                return userClient.v2.tweet(context.propsValue.text);
            }
        },
    }
});
