import { createAction } from '@activepieces/pieces-framework';
import {
    httpClient,
    HttpMethod,
    HttpRequest
} from "@activepieces/pieces-common";
import { mauticCommon } from "../common";

export const searchContact = createAction({
    description: 'Search for a contact in Mautic CRM', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Search Contact',
    name: 'search_mautic_contact',
    props: {
        authentication: mauticCommon.authentication,
        fields: mauticCommon.contactFields,
    },
    run: async function (context) {
        const { base_url, username, password } = context.propsValue.authentication;
        const url = (base_url.endsWith('/') ? base_url : base_url + '/') + 'api/contacts';
        const fields = context.propsValue.fields;
        const keys = Object.keys(fields);
        let count=0;
        let searchParams = "?";
        for(const key of keys){
            if(fields[key]){
                console.log(key);
                searchParams += `where[${count}][col]=${key}&where[${count}][expr]=eq&where[${count}][val]=${fields[key]}&`;
                ++count;
            }
        }
        console.log(searchParams);
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${url}${searchParams}`,
            headers:{
                'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
                'Content-Type': 'application/json'
            }
        }
        return await httpClient.sendRequest(request);
    },
});
