
import { createAction, Property } from "@activepieces/pieces-framework";
import { simplybookMeAuth } from "../common/auth";
import { SimplybookMeClient } from "../common/client";

export const createClient = createAction({
    auth: simplybookMeAuth,
    name: 'create_client',
    displayName: 'Create a Client',
    description: 'Creates a new client record in SimplyBook.me.',
    props: {
        name: Property.ShortText({
            displayName: 'Full Name',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'Depending on company settings, this may be required.',
            required: true,
        }),
        phone: Property.ShortText({
            displayName: 'Phone Number',
            description: 'Depending on company settings, this may be required.',
            required: true,
        }),
        address1: Property.ShortText({
            displayName: 'Address Line 1',
            required: false,
        }),
        address2: Property.ShortText({
            displayName: 'Address Line 2',
            required: false,
        }),
        city: Property.ShortText({
            displayName: 'City',
            required: false,
        }),
        zip: Property.ShortText({
            displayName: 'ZIP / Postal Code',
            required: false,
        }),
        country_id: Property.ShortText({
            displayName: 'Country ID',
            description: 'The two-letter country code (e.g., US, GB).',
            required: false,
        }),
        sendEmail: Property.Checkbox({
            displayName: 'Send Notification Email',
            description: 'Check this box to send a notification email to the new client.',
            required: false,
            defaultValue: false,
        }),
    },

    async run(context) {
        const { name, email, phone, address1, address2, city, zip, country_id, sendEmail } = context.propsValue;

        const client = new SimplybookMeClient(context.auth);

        const clientData: { [key: string]: string | undefined } = {
            name,
            email,
            phone,
            address1,
            address2,
            city,
            zip,
            country_id,
        };

        Object.keys(clientData).forEach(key => {
            if (clientData[key] === undefined || clientData[key] === '') {
                delete clientData[key];
            }
        });
        
        const params = [
            clientData,
            sendEmail ?? false 
        ];


        return await client.makeRpcRequest('addClient', params);
    },
});