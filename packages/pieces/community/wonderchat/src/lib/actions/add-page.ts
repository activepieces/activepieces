import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const addPage = createAction({
    auth: wonderchatAuth,
    name: 'add_page',
    displayName: 'Add Page',
    description: "Add new pages to your chatbot's knowledge base.",
    props: {
        chatbotId: Property.ShortText({
            displayName: 'Chatbot ID',
            description: 'The ID of the chatbot to add pages to.',
            required: true,
        }),
        urls: Property.Array({
            displayName: 'URLs',
            description: 'A list of URLs to add to your chatbot. Each URL should be on a new line.',
            required: true,
        }),
        sessionCookie: Property.ShortText({
            displayName: 'Session Cookie',
            description: 'Session cookie for crawling sites that require a login.',
            required: false,
        }),
    },
    async run(context) {
        
        const { apiKey } = context.auth;

        
        const { chatbotId, urls, sessionCookie } = context.propsValue;

        
        const body = {
            apiKey,
            chatbotId,
            
            urls,
            sessionCookie,
        };

        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://app.wonderchat.io/api/v1/add-pages',
            body: body,
        });

        
        return response.body;
    },
});
