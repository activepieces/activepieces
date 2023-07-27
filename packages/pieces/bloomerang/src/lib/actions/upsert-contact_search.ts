import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { bloomerangCommon } from '../common/common';
import { bloomerangAuth } from '../..';

export const bloomerangUpsertContactsSearch = createAction({
    auth: bloomerangAuth,
    name: 'upsert_contact_search',
    description: 'Update or create bloomerang contact using the search',
    displayName: 'Upsert Contact (Search)',
    props: {
        search: Property.ShortText({
            displayName: "Search",
            description: "The text to search",
            required: true,
        }),
        skip: Property.Number({
            displayName: "Skip",
            description: "The number of items to skip before starting to collect the result set.",
            required: false,
        }),
        take: Property.Number({
            displayName: "Take",
            description: "The number of items to include in the result set.",
            required: false,
        }),
        contact_type: bloomerangCommon.contact_type,
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
    async run(context) {
        const { contact_json, contact_type, skip, search, take } = context.propsValue
        let url = `${bloomerangCommon.baseUrl}/constituents/search?search=${search}`;
        if (contact_type) url += `&type=${contact_type}`;
        if (skip) url += `&skip=${skip}`;
        if (take) url += `&take=${take}`;
        const findContact = (await httpClient.sendRequest({
            method: HttpMethod.GET,
            url,
            headers: {
                "X-API-KEY": context.auth,
            },
        })).body;
        if (findContact.ResultCount > 0) {
            const contactID = findContact.Results[0].Id
            return (await httpClient.sendRequest({
                method: HttpMethod.PUT,
                url: `${bloomerangCommon.baseUrl}/constituent/${contactID}`,
                headers: {
                    "X-API-KEY": context.auth,
                },
                body: contact_json
            })).body
        } else {
            return (await httpClient.sendRequest({
                method: HttpMethod.POST,
                url: `${bloomerangCommon.baseUrl}/constituent`,
                headers: {
                    "X-API-KEY": context.auth,
                },
                body: contact_json
            })).body
        }
    }
});
