import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../../';

export const bloomerangUpsertContact = createAction({
    auth: bloomerangAuth,
    action: {
        name: 'upsert_contact',
        description: 'Update or create bloomerang contact',
        displayName: 'Upsert Contact (Advanced)',
        props: {
            first_name: Property.ShortText({
                displayName: "Firs name",
                description: "Firs name",
                required: false
            }),
            last_name: Property.ShortText({
                displayName: "Last name",
                description: "Last name",
                required: false
            }),
            organization_name: Property.ShortText({
                displayName: "Organization name",
                description: "Organization name",
                required: true,
            }),
            street: Property.ShortText({
                displayName: "Street",
                description: "Street",
                required: false,
            }),
            phone_number: Property.ShortText({
                displayName: "Phone number",
                description: "Phone number",
                required: false,
            }),
            email_address: Property.Number({
                displayName: "Email number",
                description: "Email number",
                required: false,
            }),
            type: Property.Number({
                displayName: "Type",
                description: "Type",
                required: false,
            }),

            contact_json: Property.Json({
                displayName: "Contact (JSON)",
                description: "The Contact JSON",
                defaultValue: {
                    "Type": "Individual",
                    "FirstName": "name",
                    "LastName": "surname",
                    "FullName": "full name",
                    "PrimaryEmail": {
                        "Type": "Home",
                        "Value": "test@test.com"
                    }
                },
                required: true
            })
        },
        async run({ auth, propsValue }) {
            const { contact_json, street, email_address, phone_number, first_name, last_name, organization_name, type } = propsValue
            if (!street && !email_address && !phone_number && !first_name && !last_name && !organization_name && !type) {
                throw new Error('Missing search parameters');
            }
            let url = `${bloomerangCommon.baseUrl}/constituent/duplicates?`;
            if (street) url += `street=${street}&`;
            if (email_address) url += `emailAddress=${email_address}&`;
            if (phone_number) url += `phoneNumber=${phone_number}&`;
            if (first_name) url += `firstName=${first_name}`;
            if (last_name) url += `lastName=${last_name}`;
            if (organization_name) url += `organizationName=${organization_name}`;
            if (type) url += `type=${type}`;
            const findContact = (await httpClient.sendRequest({
                method: HttpMethod.GET,
                url,
                headers: {
                    "X-API-KEY": auth,
                },
            })).body;
            if (findContact.Total > 0) {
                const contactID = findContact.Result[0].id
                return (await httpClient.sendRequest({
                    method: HttpMethod.PUT,
                    url: `${bloomerangCommon.baseUrl}/constituent/${contactID}`,
                    headers: {
                        "X-API-KEY": auth,
                    },
                    body: contact_json
                })).body
            } else {
                return (await httpClient.sendRequest({
                    method: HttpMethod.POST,
                    url: `${bloomerangCommon.baseUrl}/constituent`,
                    headers: {
                        "X-API-KEY": auth,
                    },
                    body: contact_json
                })).body
            }
        },
    },
});
