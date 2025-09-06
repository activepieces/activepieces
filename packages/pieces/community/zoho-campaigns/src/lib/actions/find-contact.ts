import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsOptionalMailingListDropdown } from '../common/props';

export const findContactAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Looks up an existing contact by their email address.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: "The email address of the contact to find.",
            required: true,
        }),
        list_key: zohoCampaignsOptionalMailingListDropdown,
    },
    async run({ auth, propsValue }) {
        const queryParams: { [key: string]: string } = {
            resfmt: 'JSON',
            emailids: propsValue.email,
        };

        if (propsValue.list_key) {
            queryParams['listkey'] = propsValue.list_key;
        }

        const response = await httpClient.sendRequest<{ contacts: unknown[] }>({
            method: HttpMethod.GET,
            url: 'https://campaigns.zoho.com/api/v1.1/contact/getdetails',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
            },
            queryParams: queryParams,
        });

        
        return response.body.contacts;
    },
});