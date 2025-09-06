import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsSingleMailingListDropdown, zohoCampaignsTagsDropdown } from '../common/props';

export const addTagToContactAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'add_tag_to_contact',
    displayName: 'Add Tag to Contact',
    description: 'Apply one or more tags to a contact.',
    props: {
        email: Property.ShortText({
            displayName: 'Contact Email',
            description: "The email address of the contact you want to tag.",
            required: true,
        }),
        list_key: zohoCampaignsSingleMailingListDropdown,
        tags: zohoCampaignsTagsDropdown,
    },
    async run({ auth, propsValue }) {
        const body = new URLSearchParams({
            resfmt: 'JSON',
            listkey: propsValue.list_key,
            emailids: propsValue.email,
            tagname: (propsValue.tags as string[]).join(','),
        });

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/tag/associate',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });

        return response.body;
    },
});