import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const deleteCampaignAction = createAction({
    name: 'delete-campaign',
    displayName: 'Delete Campaign',
    description: 'Delete a campaign with optional contact list deletion.',
    auth: kallabotAuth,
    props: {
        campaign_id: Property.ShortText({
            displayName: 'Campaign ID',
            description: 'The ID of the campaign to delete.',
            required: true
        }),
        delete_contact_list: Property.Checkbox({
            displayName: 'Delete Contact List',
            description: 'Also delete the associated contact list (optional).',
            required: false,
            defaultValue: false
        })
    },
    async run(context) {
        const params = new URLSearchParams();
        if (context.propsValue.delete_contact_list) {
            params.append('delete_contact_list', 'true');
        }

        const url = `https://api.kallabot.com/campaign/${context.propsValue.campaign_id}${params.toString() ? '?' + params.toString() : ''}`;

        const response = await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: url,
            headers: {
                'Authorization': `Bearer ${context.auth}`,
                'Content-Type': 'application/json'
            }
        });

        return response.body;
    }
});