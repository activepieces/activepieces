import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

export const unsubscribeSubscriberAction = createAction({
    auth: campaignMonitorAuth,
    name: 'unsubscribe_subscriber',
    displayName: 'Unsubscribe Subscriber',
    description: 'Remove a subscriber from a list',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to remove the subscriber from',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the subscriber to unsubscribe',
            required: true,
        }),
    },
    async run({ propsValue, auth }) {
        const { listId, email } = propsValue;

        const payload = {
            EmailAddress: email
        };

        const response = await makeRequest(
            { apiKey: auth as string },
            HttpMethod.POST,
            `/subscribers/${listId}/unsubscribe.json`,
            payload
        );

        return response;
    },
});
