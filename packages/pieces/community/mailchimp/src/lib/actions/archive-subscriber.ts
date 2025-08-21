import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const archiveSubscriber = createAction({
    auth: mailchimpAuth,
    name: 'archive_subscriber',
    displayName: 'Archive Subscriber',
    description: 'Archives a subscriber in a specific audience.',
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        email: Property.ShortText({
            displayName: 'Subscriber Email',
            description: 'The email address of the subscriber to archive.',
            required: true,
        }),
    },
    async run(context) {
        const { list_id, email } = context.propsValue;
        const accessToken = context.auth.access_token;

        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(
            accessToken
        );

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        const subscriberHash = mailchimpCommon.getMD5EmailHash(email);

        // The Mailchimp API returns an empty 204 response on success.
        // We cast to 'any' because the SDK types can be incomplete.
        await (mailchimp as any).lists.deleteListMember(
            list_id,
            subscriberHash
        );

        return {
            success: true,
        };
    },
});