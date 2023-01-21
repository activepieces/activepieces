import { httpClient } from '../../../common/http/core/http-client';
import { HttpMethod } from '../../../common/http/core/http-method';
import { HttpRequest } from '../../../common/http/core/http-request';
import { createAction } from '../../../framework/action/action';
import { Property } from '../../../framework/property';
import { blackbaudCommon } from '../common/common';
import Ajv, { JSONSchemaType } from "ajv"
const ajv = new Ajv()

const schema = {
    type: 'array',
    items: [{
        type: 'object'
    }]
};

export const blackbaudCreateContacts = createAction({
    name: 'create_contact_batch',
    description: 'Create contacts on blackbaud',
    displayName: 'Create Contacts',
    props: {
        ...blackbaudCommon.auth_props,
        // Check the documentation for sample input
        contacts: Property.LongText({
            displayName: "Contacts JSON List",
            description: "Check the documentation for exact schema",
            required: true
        })
    },
    sampleData: [
        {
            "id": "625717"
        }
    ],
    async run(configValue) {
        let contacts = parseContacts(configValue.propsValue['contacts']!);
        let validation = ajv.compile(schema);
        if (!validation(contacts)) {
            throw new Error("The input is not an json array, check contacts field in the input");
        }
        let responses = [];
        const accessToken = configValue.propsValue['authentication']?.access_token;
        for (let i = 0; i < contacts.length; ++i) {
            const request: HttpRequest<any> = {
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