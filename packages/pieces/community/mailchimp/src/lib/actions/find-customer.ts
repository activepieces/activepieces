import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findCustomer = createAction({
    auth: mailchimpAuth,
    name: 'find_customer',
    displayName: 'Find Customer',
    description: 'Finds a customer in a specific e-commerce store by their email address.',
    props: {
        store_id: Property.Dropdown({
            displayName: 'Store',
            description: 'The e-commerce store to search in.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your Mailchimp account first.',
                    };
                }

                const authProp = auth as OAuth2PropertyValue;
                const accessToken = authProp.access_token;
                const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
                
                mailchimp.setConfig({
                    accessToken: accessToken,
                    server: serverPrefix,
                });

                // The SDK types are incomplete, so we cast to 'any'.
                const response = await (mailchimp as any).ecommerce.stores();

                const options = response.stores.map((store: { id: string; name: string }) => ({
                    label: store.name,
                    value: store.id,
                }));

                return {
                    disabled: false,
                    options: options,
                };
            }
        }),
        email: Property.ShortText({
            displayName: 'Customer Email',
            description: 'The email address of the customer to find.',
            required: true,
        }),
    },
    async run(context) {
        const { store_id, email } = context.propsValue;
        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        // For the e-commerce API, the customer_id is their email address.
        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).ecommerce.getStoreCustomer(store_id, email);
    },
});