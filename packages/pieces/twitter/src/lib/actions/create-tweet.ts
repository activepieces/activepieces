import { Property, createAction } from "@activepieces/pieces-framework";
import { TwitterApi } from 'twitter-api-v2';

const markdownDescription = `
The Steps to obtain the required credentials:

1. Go to [https://developer.twitter.com/en/portal/projects-and-apps](https://developer.twitter.com/en/portal/projects-and-apps) and create a new app.

2. Go to the app details page and click on the **Keys and tokens** tab.

3. Copy the following values from the **Keys and tokens** tab:

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
    },
    async run(context) {
        const { consumerKey, consumerSecret, accessToken, accessTokenSecret } = context.propsValue.authentication;
        const userClient = new TwitterApi({
            appKey: consumerKey,
            appSecret: consumerSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });

        return userClient.v2.tweet(context.propsValue.text);
    },
});
