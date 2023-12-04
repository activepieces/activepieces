import { createAction, Property } from "@activepieces/pieces-framework";
import { bitlyAuth } from "../..";

export const createQrFromBitlink = createAction({
    auth: bitlyAuth,
    name: 'create_qr_from_bitlink',
    description: 'Create a QR code from a Bitlink',
    displayName: 'Create QR from Bitlink',
    props: {
        id: Property.ShortText({
            description: 'The ID of the Bitlink',
            displayName: 'Bitlink ID',
            required: true
        }),
        color: Property.ShortText({
            description: 'The color of the QR code (ex: 1133ff)',
            displayName: 'Color',
            required: false
        }),
        exclude_logo: Property.Checkbox({
            description: 'Exclude the Bitly logo from the QR code',
            displayName: 'Exclude Logo',
            required: false
        }),
        
    },
    async run(context) {

        const requestBody: Record<string, unknown> = {};
        if (context.propsValue.color) {
            requestBody["color"] = context.propsValue.color;
        }
        if (context.propsValue.exclude_logo) {
            requestBody["exclude_logo"] = context.propsValue.exclude_logo;
        }
       
        const response = await fetch(`https://api-ssl.bitly.com/v4/bitlinks/${context.propsValue.id}/qr`, {
            method: 'POST',
            
            headers: {
                'Authorization': `Bearer ${context.auth as string}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        })
        const json = await response.json();
        return json;
       
    }
})