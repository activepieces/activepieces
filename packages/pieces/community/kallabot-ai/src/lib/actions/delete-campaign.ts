import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { kallabotAuth } from '../..';

export const deleteCampaignAction = createAction({
    name: 'delete-campaign',
    displayName: 'Delete Campaign',
    description: 'Delete a campaign with optional contact list deletion.',
    audience: 'both',
    aiMetadata: {
        description: 'Permanently delete an outbound campaign by its campaign ID, optionally also deleting its associated contact list. Use it to clean up a campaign that is no longer needed; this is destructive. Idempotent in effect: once the campaign is gone, repeating the call leaves nothing further to delete.',
        idempotent: true,
    },
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
                'Authorization': `Bearer ${context.auth.secret_text}`,
                'Content-Type': 'application/json'
            }
        });

        return response.body;
    }
});