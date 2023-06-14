import { Property, createAction } from "@activepieces/pieces-framework";
import { TwitterApi } from 'twitter-api-v2';

const markdownDescription = `
The steps to obtain the required credentials:

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps) and create a new app.

2. Make sure your app is placed in a project (it won't work otherwise).

3. In your app, go to Settings -> User authentication set up -> Update permission to **Read and Write**.

4. Go to Keys and tokens tab.

5. Copy the following values from the **Keys and tokens** tab:

    - Click on **API key and secret** and copy the following values:
    
        **Api Key**
        
        **Api Key Secret**
        
    - Click on **Access token and secret** and copy the following values:
    
        **Access Token**
        
        **Access Token Secret**
`

export const createTweet = createAction({
    name: "create-tweet",
    displayName: "Create Tweet",
    description: "Create a tweet",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
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
            required: true,
        }),
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
        const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = context.propsValue.authentication;
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
});
