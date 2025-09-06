import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleTagDropdown } from '../common/props';

export const removeTagFromContactAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'remove_tag_from_contact',
    displayName: 'Remove Tag from Contact',
    description: 'Removes a specific tag from a contact.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: "The email address of the contact.",
            required: true,
        }),
        tag: zohoCampaignsSingleTagDropdown,
    },
    async run({ auth, propsValue }) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://campaigns.zoho.com/api/v1.1/tag/deassociate',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
            },
            queryParams: {
                resfmt: 'JSON',
                lead_email: propsValue.email,
                tagName: propsValue.tag,
            }
        });

        return response.body;
    },
});