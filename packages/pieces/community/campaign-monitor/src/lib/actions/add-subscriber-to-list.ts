import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

interface CustomField {
    key: string;
    value: string;
}

export const addSubscriberToListAction = createAction({
    auth: campaignMonitorAuth,
    name: 'add_subscriber_to_list',
    displayName: 'Add Subscriber to List',
    description: 'Add a new subscriber to a list',
    props: {
        listId: Property.ShortText({
            displayName: 'List ID',
            description: 'The ID of the list to add the subscriber to',
            required: true,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'The email address of the subscriber',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the subscriber',
            required: false,
        }),
        customFields: Property.Array({
            displayName: 'Custom Fields',
            description: 'Custom fields for the subscriber',
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
        resubscribe: Property.Checkbox({
            displayName: 'Resubscribe',
            description: 'If true, the subscriber will be resubscribed if they previously unsubscribed',
            required: false,
            defaultValue: true,
        }),
    },
    async run({ propsValue, auth }) {
        const { listId, email, name, customFields, consentToTrack, resubscribe } = propsValue;

        const formattedCustomFields = (customFields as CustomField[] | undefined)?.map(field => ({
            Key: field.key,
            Value: field.value,
        })) || [];

        const payload = {
            EmailAddress: email,
            Name: name || '',
            CustomFields: formattedCustomFields,
            ConsentToTrack: consentToTrack,
            Resubscribe: resubscribe ?? true,
        };

        const response = await makeRequest(
            { apiKey: auth as string },
            HttpMethod.POST,
            `/subscribers/${listId}.json`,
            payload
        );

        return response;
    },
});
