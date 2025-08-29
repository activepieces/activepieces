import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const unsubscribeEmail = createAction({
    auth: mailchimpAuth,
    name: 'unsubscribe_email',
    displayName: 'Unsubscribe Email',
    description: 'Unsubscribes an email address from a specific audience.',
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        email: Property.ShortText({
            displayName: 'Subscriber Email',
            description: 'The email address to unsubscribe.',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, email } = context.propsValue;
        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        const payload = {
            members: [
                {
                    email_address: email,
                    status: 'unsubscribed',
                },
            ],
            update_existing: true,
        };

        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).lists.batchListMembers(list_id, payload);
    },
});