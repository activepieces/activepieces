import { createAction, Property } from "@activepieces/pieces-framework";
import { bitlyAuth } from "../..";

export const shortenUrl = createAction({
    auth: bitlyAuth,
    name: 'shorten_url',
    description: 'Shorten a URL using Bitly',
    displayName: 'Shorten URL',
    props: {
        url: Property.ShortText({
            description: 'The URL to shorten',
            displayName: 'URL',
            required: true
        })
    },
    async run(context) {
        
        const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${context.auth as string}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({"long_url": context.propsValue.url})
        })
        const json = await response.json();
        return json;
       
    }
})