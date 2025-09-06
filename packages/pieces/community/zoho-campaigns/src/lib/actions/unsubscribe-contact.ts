import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleMailingListDropdown, zohoCampaignsTopicDropdown } from '../common/props';

export const unsubscribeContactAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'unsubscribe_contact',
    displayName: 'Unsubscribe Contact',
    description: 'Removes a contact from a specific mailing list.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: "The email address of the contact to unsubscribe.",
            required: true,
        }),
        list_key: zohoCampaignsSingleMailingListDropdown,
        topic_id: zohoCampaignsTopicDropdown,
    },
    async run({ auth, propsValue }) {
        
        const contactInfo = {
            "Contact Email": propsValue.email,
        };

        const queryParams: { [key: string]: string } = {
            resfmt: 'JSON',
            listkey: propsValue.list_key,
            contactinfo: JSON.stringify(contactInfo),
        };

        if (propsValue.topic_id) {
            queryParams['topic_id'] = propsValue.topic_id;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/json/listunsubscribe',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
            },
            queryParams: queryParams,
        });

        return response.body;
    },
});