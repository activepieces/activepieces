import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const findSubscriber = createAction({
    auth: mailchimpAuth,
    name: 'find_subscriber',
    displayName: 'Find Subscriber',
    description: 'Finds a subscriber in an audience by their email address.',
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        email: Property.ShortText({
            displayName: 'Subscriber Email',
            description: 'The email address of the subscriber to find.',
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

        const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

        // The SDK types are incomplete, so we cast to 'any'.
        // This endpoint retrieves a specific list member.
        return await (mailchimp as any).lists.getListMember(
            list_id,
            subscriberHash
        );
    },
});