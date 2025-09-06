import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { zohoCampaignsAuth } from '../..';
import { zohoCampaignsMailingListDropdown, zohoCampaignsTopicDropdown } from '../common/props';

export const createCampaignAction = createAction({
    auth: zohoCampaignsAuth,
    name: 'create_campaign',
    displayName: 'Create Campaign',
    description: 'Create a new campaign in Zoho Campaigns.',
    props: {
        campaign_name: Property.ShortText({
            displayName: 'Campaign Name',
            required: true,
        }),
        subject: Property.ShortText({
            displayName: 'Subject',
            required: true,
        }),
        from_email: Property.ShortText({
            displayName: 'From Email',
            description: "The sender's email address for the campaign.",
            required: true,
        }),
        mailing_lists: zohoCampaignsMailingListDropdown,
        topic_id: zohoCampaignsTopicDropdown,
        content_url: Property.ShortText({
            displayName: 'Content URL',
            description: 'A public URL where the HTML content of the email is hosted.',
            required: false,
        }),
    },
    async run({ auth, propsValue }) {
        
        const listDetailsObject: { [key: string]: string[] } = {};
        propsValue.mailing_lists.forEach((listKey: string) => {
            listDetailsObject[listKey] = []; 
        });
        const listDetailsEncoded = encodeURIComponent(JSON.stringify(listDetailsObject));

        const params = {
            resfmt: 'JSON',
            campaignname: propsValue.campaign_name,
            subject: propsValue.subject,
            from_email: propsValue.from_email,
            list_details: listDetailsEncoded,
            ...(propsValue.topic_id && { topicId: propsValue.topic_id }),
            ...(propsValue.content_url && { content_url: propsValue.content_url }),
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://campaigns.zoho.com/api/v1.1/createCampaign',
            headers: {
                'Authorization': `Zoho-oauthtoken ${auth.access_token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(params).toString(),
        });

        return response.body;
    },
});