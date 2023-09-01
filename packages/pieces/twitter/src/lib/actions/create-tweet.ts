import { Property, Validators, createAction } from "@activepieces/pieces-framework";
import { TwitterApi } from 'twitter-api-v2';
import { twitterAuth } from "../..";

export const createTweet = createAction({
    auth: twitterAuth,

    name: "create-tweet",
    displayName: "Create Tweet",
    description: "Create a tweet",
    props: {
        text: Property.LongText({
            displayName: "Text",
            description: "The text of the tweet",
            required: true,
            validators: [Validators.minLength(1)]
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
    
        try {
            const media = context.propsValue.image;
            let uploaded="";
    
            if (media) {
                uploaded = await userClient.v1.uploadMedia(Buffer.from(media.base64, "base64"), {
                    mimeType: 'image/png',
                    target: 'tweet'
                });
            }
    
            const response = media
            ? await userClient.v2.tweet(context.propsValue.text, {
                  media: {
                      media_ids: [uploaded]
                  }
              })
            : await userClient.v2.tweet(context.propsValue.text);
            return response || { success: true };
        } catch ( error ) {
            const mod_error = error as {
                code: number,
                errors: unknown[]
            };
            throw {
                code : mod_error.code,
                errors : mod_error.errors
            }
        }
    },
});
