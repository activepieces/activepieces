import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleMailingListDropdown } from '../common/props';

export const addContactToListAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'add_contact_to_list',
    displayName: 'Add Contact to Mailing List',
    description: 'Adds a contact to a specific mailing list.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: "The email address of the contact to add. You can add up to 10 emails, separated by commas.",
            required: true,
        }),
        list_key: zohoCampaignsSingleMailingListDropdown,
    },
    async run({ auth, propsValue }) {
        const body = new URLSearchParams({
            resfmt: 'JSON',
            listkey: propsValue.list_key,
            emailids: propsValue.email,
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/addlistsubscribersinbulk',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        return response.body;
    },
});