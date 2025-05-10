import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

export const findSubscriberAction = createAction({
    auth: campaignMonitorAuth,
    name: 'find_subscriber',
    displayName: 'Find Subscriber',
    description: 'Find a subscriber by email in a specific list',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to search for the subscriber',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the subscriber to find',
            required: true,
        }),
    },
    async run({ propsValue, auth }) {
        const { listId, email } = propsValue;

        try {
            const response = await makeRequest(
                { apiKey: auth as string },
                HttpMethod.GET,
                `/subscribers/${listId}.json?email=${encodeURIComponent(email)}&includetrackingpreference=true`
            );

            return {
                found: true,
                subscriber: response
            };
        } catch (error: any) {
            // If subscriber is not found, API returns a 404
            if (error.status === 404) {
                return {
                    found: false,
                    subscriber: null
                };
            }
            throw error;
        }
    },
});
