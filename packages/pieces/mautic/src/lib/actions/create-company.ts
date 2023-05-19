import { createAction } from '@activepieces/pieces-framework';
import {
    httpClient,
    HttpMethod,
    HttpRequest
} from "@activepieces/pieces-common";
import { mauticCommon } from "../common";

export const createCompany = createAction({
    description: 'Creates a new company in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Create Company',
    name: 'create_mautic_company',
    props: {
        authentication: mauticCommon.authentication,
        fields: mauticCommon.companyFields
    },
    run: async function (context) {
        const { base_url, username, password } = context.propsValue.authentication;
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: (base_url.endsWith('/') ? base_url : base_url + '/') + 'api/companies/new',
            body: JSON.stringify(context.propsValue.fields),
            headers:{
                'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
                'Content-Type': 'application/json'
            }
        }
        return await httpClient.sendRequest(request);
    },
});
