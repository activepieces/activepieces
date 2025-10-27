import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uscreenAuth } from '../common/auth';
import { uscreenCommon } from '../common/client';

export const assignUserAccess = createAction({
    name: 'assign_user_access',
    displayName: 'Assign User Access',
    description: 'Assigns a bundle or subscription to a customer. Creates a new customer if one doesn\'t exist.',
    auth: uscreenAuth,
    props: {
        user_email: Property.ShortText({
            displayName: 'User Email',
            description: 'Email address of the user to assign access to',
            required: true,
        }),
        access_type: Property.StaticDropdown({
            displayName: 'Access Type',
            description: 'Type of access to assign',
            required: true,
            options: {
                options: [
                    { label: 'Bundle', value: 'bundle' },
                    { label: 'Subscription', value: 'subscription' },
                ]
            }
        }),
        bundle_id: Property.Dropdown({
            displayName: 'Bundle',
            description: 'Bundle to assign access to',
            required: false,
            refreshers: ['access_type'],
            options: async ({ auth, access_type }) => {
                if (!auth || access_type !== 'bundle') {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate and select bundle access type first'
                    };
                }
                const response = await uscreenCommon.apiCall({
                    auth: auth as string,
                    method: HttpMethod.GET,
                    resourceUri: '/bundles'
                });
                const bundles = response.body.data ?? [];
                return {
                    disabled: false,
                    options: bundles.map((bundle: { id: string; name: string }) => ({
                        label: bundle.name,
                        value: bundle.id
                    }))
                };
            }
        }),
        subscription_id: Property.Dropdown({
            displayName: 'Subscription',
            description: 'Subscription to assign access to',
            required: false,
            refreshers: ['access_type'],
            options: async ({ auth, access_type }) => {
                if (!auth || access_type !== 'subscription') {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate and select subscription access type first'
                    };
                }
                const response = await uscreenCommon.apiCall({
                    auth: auth as string,
                    method: HttpMethod.GET,
                    resourceUri: '/subscriptions'
                });
                const subscriptions = response.body.data ?? [];
                return {
                    disabled: false,
                    options: subscriptions.map((subscription: { id: string; name: string }) => ({
                        label: subscription.name,
                        value: subscription.id
                    }))
                };
            }
        }),
        send_welcome_email: Property.Checkbox({
            displayName: 'Send Welcome Email',
            description: 'Whether to send a welcome email to the user',
            required: false,
        }),
    },
    async run(context) {
        const { user_email, access_type, bundle_id, subscription_id, send_welcome_email } = context.propsValue;

        let resourceUri = '';
        let body: any = {
            user_email,
            send_welcome_email: send_welcome_email || false
        };

        if (access_type === 'bundle') {
            resourceUri = '/bundles/assign-access';
            body.bundle_id = bundle_id;
        } else if (access_type === 'subscription') {
            resourceUri = '/subscriptions/assign-access';
            body.subscription_id = subscription_id;
        }

        const response = await uscreenCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri,
            body,
        });

        return response.body;
    },
});
