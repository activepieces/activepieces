import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const addTag = createAction({
    
    auth: wonderchatAuth,
    name: 'add_tag',
    displayName: 'Add Tag',
    description: "Add custom tags to a specific chatlog.",
    props: {
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: 'The ID of the chatlog to add tags to.',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags you want to add to the chatlog. Each tag should be on a new line.',
            required: true,
        }),
    },
    async run(context) {
        
        const { apiKey } = context.auth;

        
        const { chatlogId, tags } = context.propsValue;

        
        const body = {
            apiKey,
            chatlogId,
            
            tags,
        };

       
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://app.wonderchat.io/api/v1/add-tags-to-chatlog',
            body: body,
        });

       
        return response.body;
    },
});
