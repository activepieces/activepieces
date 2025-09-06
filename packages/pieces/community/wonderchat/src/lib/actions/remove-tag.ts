import { createAction,  Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { wonderchatAuth } from "../common/auth";

export const removeTag = createAction({
    
    auth: wonderchatAuth,
    name: 'remove_tag',
    displayName: 'Remove Tag',
    description: "Remove specific tags from a chatlog.",
    props: {
        chatlogId: Property.ShortText({
            displayName: 'Chatlog ID',
            description: 'The ID of the chatlog to remove tags from.',
            required: true,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'The tags you want to remove from the chatlog. Each tag should be on a new line.',
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
            url: 'https://app.wonderchat.io/api/v1/delete-tags-from-chatlog',
            body: body,
        });

        
        return response.body;
    },
});
