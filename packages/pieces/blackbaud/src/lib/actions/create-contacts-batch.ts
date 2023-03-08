import { blackbaudCommon } from '../common/common';
import Ajv from "ajv";
import { createAction, Property, HttpRequest, HttpMethod, httpClient } from '@activepieces/framework';

const ajv = new Ajv();

const schema = {
    type: 'array',
    items: [{
        type: 'object'
    }]
};

export const blackbaudCreateContacts = createAction({
    name: 'create_contact_batch',
    description: 'Create contacts on blackbaud',
    displayName: 'Create Contacts (Batch)',
    props: {
        ...blackbaudCommon.auth_props,
        contacts: Property.Json({
            displayName: "Contacts JSON List",
            description: "Check the documentation for exact schema",
            required: true,
            defaultValue: [
                {
                    "email": {
                        "address": "Kilgore_Trout64@gmail.com",
                        "do_not_email": false,
                        "inactive": false,
                        "primary": true,
                        "type": "Email"
                    },
                    "first": "Kilgore",
                    "last": "Trout",
                    "phone": {
                        "do_not_call": false,
                        "inactive": false,
                        "number": "843-537-3397",
                        "primary": true,
                        "type": "Home"
                    },
                    "address": {
                        "street1": "Street 41",
                        "city": "Calforina",
                        "state": "CA",
                        "zip": "19941",
                        "type": "Business",
                        "country": "USA"
                    },
                    "type": "Individual"
                }
            ]
        })
    },
    sampleData: [
        {
            "id": "625717"
        }
    ],
    async run(configValue) {
        const contacts = parseContacts(configValue.propsValue['contacts']!);
        const validation = ajv.compile(schema);
        if (!validation(contacts)) {
            throw new Error("The input is not an json array, check contacts field in the input");
        }
        const responses = [];
        const accessToken = configValue.propsValue['authentication']?.access_token;
        for (let i = 0; i < contacts.length; ++i) {
            const request: HttpRequest = {
                method: HttpMethod.POST,
                url: `${blackbaudCommon.baseUrl}/constituent/v1/constituents`,
                body: contacts[i],
                headers: {
                    "Bb-Api-Subscription-Key": configValue.propsValue['subscription_key'],
                    Authorization: `Bearer ${accessToken}`,
                },
            };
            responses.push((await httpClient.sendRequest<{ count: number; next_link: string; value: unknown[] }>(request)).body);
        }
        return responses;
    },
});




function parseContacts(contacts: any): any[] {
    if (typeof contacts === 'string') {
        return JSON.parse(contacts);
    }
    return contacts;
}
