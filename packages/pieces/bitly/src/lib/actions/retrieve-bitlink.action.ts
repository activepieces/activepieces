import { createAction, Property } from "@activepieces/pieces-framework";
import { bitlyAuth } from "../..";

export const retrieveBitlink = createAction({
    auth: bitlyAuth,
    name: 'retrieve_bitlink',
    description: 'Retrieve a Bitlink',
    displayName: 'Retrieve Bitlink',
    props: {
        id: Property.ShortText({
            description: 'The ID of the Bitlink to retrieve',
            displayName: 'Bitlink ID',
            required: true
        })
    },
    async run(context) {
        
        const response = await fetch(`https://api-ssl.bitly.com/v4/bitlinks/${context.propsValue.id}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${context.auth as string}`,
                'Content-Type': 'application/json'
            },
        })
        const json = await response.json();
        return json;
       
    }
})