import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

interface CustomField {
    key: string;
    value: string;
}

export const updateSubscriberDetailsAction = createAction({
    auth: campaignMonitorAuth,
    name: 'update_subscriber_details',
    displayName: 'Update Subscriber Details',
    description: 'Update an existing subscriber in a list',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list containing the subscriber',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the existing subscriber',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The updated name of the subscriber',
            required: false,
        }),
        customFields: Property.Array({
            displayName: 'Custom Fields',
            description: 'Custom fields to update for the subscriber',
            required: false,
            properties: {
                key: Property.ShortText({
                    displayName: 'Field Key',
                    required: true,
                }),
                value: Property.ShortText({
                    displayName: 'Field Value',
                    required: true,
                }),
            },
        }),
        consentToTrack: Property.StaticDropdown({
            displayName: 'Consent to Track',
            description: 'Whether the subscriber has consented to tracking',
            required: true,
            defaultValue: 'Yes',
            options: {
                options: [
                    { label: 'Yes', value: 'Yes' },
                    { label: 'No', value: 'No' },
                    { label: 'Unchanged', value: 'Unchanged' },
                ]
            }
        }),
    },
    async run({ propsValue, auth }) {
        const { listId, email, name, customFields, consentToTrack } = propsValue;

        const formattedCustomFields = (customFields as CustomField[] | undefined)?.map(field => ({
            Key: field.key,
            Value: field.value,
        })) || [];

        const payload = {
            EmailAddress: email,
            Name: name || '',
            CustomFields: formattedCustomFields,
            ConsentToTrack: consentToTrack,
        };

        const response = await makeRequest(
            { apiKey: auth as string },
            HttpMethod.PUT,
            `/subscribers/${listId}.json?email=${encodeURIComponent(email)}`,
            payload
        );

        return response;
    },
});
