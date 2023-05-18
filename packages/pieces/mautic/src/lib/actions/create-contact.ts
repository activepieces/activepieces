import { createAction } from '@activepieces/pieces-framework';
import {
    httpClient,
    HttpHeaders,
    HttpMethod,
    HttpRequest
} from "@activepieces/pieces-common";
import { mauticCommon } from "../common";

export const createContact = createAction({
    description: 'Creates a new contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Create Contact',
    name: 'create_mautic_contact',
    sampleData: {
        "firstname": "firstname",
        "lastname": "lastname",
        "email": "email@email.com",
        "tags": "danger",
        "company": "company",
    },
    props: {
        authentication: mauticCommon.authentication,
        firstname: mauticCommon.firstname,
        lastname: mauticCommon.lastname,
        email: mauticCommon.email,
        tags: mauticCommon.tags,
        company: mauticCommon.company,
    },
    run: async function (context) {

        const {
            authentication,
            firstname,
            lastname,
            email,
            tags,
            company,
        } = context.propsValue;

        const { base_url: BASE_URL, username, password } = authentication;

        const accessToken: string = Buffer.from(`${username}:${password}`).toString('base64');

        const body = JSON.stringify({
            firstname,
            lastname,
            email,
            tags,
            company,
        });
        const headers: HttpHeaders = {
            'Authorization': 'Basic ' + accessToken,
            'Content-Type': 'application/json'
        }
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: (BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/') + 'api/contacts/new',
            body,
            headers
        }
        return await httpClient.sendRequest(request);
    },
});
