import { createTrigger, TriggerStrategy, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import { connectucAuth } from '../../index';
import { registerConnectUCWebhook, unregisterConnectUCWebhook } from '../common/webhook-helpers';
import { connectucApiCall } from '../common/api-helpers';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRecording = createTrigger({
    auth: connectucAuth,
    name: 'newRecording',
    displayName: 'New Recording',
    description: 'Triggers when a new call recording is available',
    props: {
        domain: Property.Dropdown({
            displayName: 'Domain',
            description: 'Select domain to which this trigger applies',
            required: false,
            auth: connectucAuth,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }

                try {
                    const authValue = auth as OAuth2PropertyValue;

                    interface DomainInfo {
                        domain: string;
                        reseller: string;
                        description: string;
                    }

                    const domainsResponse = await connectucApiCall<Record<string, DomainInfo>>({
                        accessToken: authValue.access_token,
                        endpoint: '/activepieces/domains',
                        method: HttpMethod.GET,
                    });

                    const options = Object.values(domainsResponse).map(domainInfo => ({
                        label: `${domainInfo.description} (${domainInfo.domain})`,
                        value: domainInfo.domain,
                    }));

                    return {
                        disabled: false,
                        options,
                    };
                } catch (error) {
                    console.error('Error fetching domains:', error);
                    return {
                        disabled: true,
                        placeholder: 'Error loading domains',
                        options: [],
                    };
                }
            },
        }),
        users: Property.MultiSelectDropdown({
            displayName: 'Users',
            description: 'Select users to which this trigger applies',
            required: false,
            auth: connectucAuth,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        placeholder: 'Please connect your account first',
                        options: [],
                    };
                }

                try {
                    const authValue = auth as OAuth2PropertyValue;

                    interface Subscriber {
                        first_name: string;
                        last_name: string;
                        user: string;
                    }

                    const subscribers = await connectucApiCall<Subscriber[]>({
                        accessToken: authValue.access_token,
                        endpoint: '/activepieces/subscribers',
                        method: HttpMethod.GET,
                    });

                    const options = [
                        {
                            label: 'All Always',
                            value: '*',
                        },
                        ...subscribers.map(subscriber => {
                            const fullName = `${subscriber.first_name} ${subscriber.last_name}`.trim();
                            return {
                                label: `${fullName} (${subscriber.user})`,
                                value: subscriber.user,
                            };
                        })
                    ];

                    return {
                        disabled: false,
                        options,
                    };
                } catch (error) {
                    console.error('Error fetching subscribers:', error);
                    return {
                        disabled: true,
                        placeholder: 'Error loading subscribers',
                        options: [],
                    };
                }
            },
        }),
    },
    sampleData: {
        dateTime: '2025-11-06T14:07:59.000Z',
        duration: '20',
        unread: true,
        mediaUrl: 'https://api.example.com/users/36090f86-ea3d-566e-b97d-6a68999d416a/recordings/eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==/url',
        origCallid: '8c0spnvbfr8gltgqfseo',
        recordingId: 'eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==',
        recordingType: 'audio',
        download_url: 'https://api.example.com/users/36090f86-ea3d-566e-b97d-6a68999d416a/recordings/eyJ0ZXJtQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8iLCJvcmlnQ2FsbGlkIjoiOGMwc3BudmJmcjhnbHRncWZzZW8ifQ==/url',
        domain: 'test.11111.service',
        user: '101',
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await registerConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            event: 'RecordingCreated',
            context,
        });
    },
    async onDisable(context){
        const auth = context.auth as OAuth2PropertyValue;

        await unregisterConnectUCWebhook({
            auth: {
                access_token: auth.access_token,
            },
            webhookUrl: context.webhookUrl,
            context,
        });
    },
    async run(context){
        return [context.payload.body]
    }
})
