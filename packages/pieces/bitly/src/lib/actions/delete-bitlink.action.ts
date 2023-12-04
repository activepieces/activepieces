import { createAction, Property } from "@activepieces/pieces-framework";
import { bitlyAuth } from "../..";

export const deleteBitlink = createAction({
    auth: bitlyAuth,
    name: 'delete_bitlink',
    description: 'Delete a Bitlink',
    displayName: 'Delete Bitlink',
    props: {
        id: Property.ShortText({
            description: 'The ID of the Bitlink to delete',
            displayName: 'Bitlink ID',
            required: true
        })
    },
    async run(context) {
        
        const response = await fetch(`https://api-ssl.bitly.com/v4/bitlinks/${context.propsValue.id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${context.auth as string}`,
                'Content-Type': 'application/json'
            },
        })
        const json = await response.json();
        return json;
       
    }
})