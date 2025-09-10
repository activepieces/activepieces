import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const createContactListAction = createAction({
    name: 'create-contact-list',
    displayName: 'Create Contact List',
    description: 'Create a new contact list.',
    auth: kallabotAuth,

    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            description: 'The name of the contact list.',
            required: true
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A description of the contact list (optional).',
            required: false
        }),
        contacts: Property.Json({
            displayName: 'Contacts JSON',
            description: 'JSON array of contacts. Each contact must have phone_number and can include name, template_variables.',
            required: true,
            defaultValue: [
                {
                    "phone_number": "+1234567890",
                    "name": "John Smith",
                    "template_variables": {
                        "first_name": "John",
                        "last_name": "Smith",
                        "company": "Acme Corp",
                        "custom_field": "value"
                    }
                },
                {
                    "phone_number": "+1987654321",
                    "name": "Jane Doe",
                    "template_variables": {
                        "first_name": "Jane",
                        "last_name": "Doe",
                        "company": "Tech Solutions",
                        "priority": "high"
                    }
                }
            ]
        })
    },
    async run(context) {
        const payload: any = {
            name: context.propsValue.name,
            contacts: context.propsValue.contacts || []
        };
        
        if (context.propsValue.description) {
            payload.description = context.propsValue.description;
        }
        
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.kallabot.com/contacts',
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            },
            body: payload
        });
        
        return response.body;
    }
});