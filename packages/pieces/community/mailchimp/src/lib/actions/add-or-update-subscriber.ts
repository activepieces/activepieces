import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const addOrUpdateSubscriber = createAction({
    auth: mailchimpAuth,
    name: 'add_or_update_subscriber',
    displayName: 'Add or Update Subscriber',
    description: 'Adds a new subscriber to an audience, or updates an existing one.',
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        email: Property.ShortText({
            displayName: 'Email',
            description: 'The email address of the subscriber.',
            required: true,
        }),
        status: Property.StaticDropdown<
            'subscribed' | 'unsubscribed' | 'cleaned' | 'pending'
        >({
            displayName: 'Status',
            description: "The subscriber's status.",
            required: true,
            options: {
                options: [
                    { label: 'Subscribed', value: 'subscribed' },
                    { label: 'Unsubscribed', value: 'unsubscribed' },
                    { label: 'Cleaned', value: 'cleaned' },
                    { label: 'Pending', value: 'pending' },
                ],
            },
            defaultValue: 'subscribed',
        }),
        first_name: Property.ShortText({
            displayName: 'First Name',
            required: false,
        }),
        last_name: Property.ShortText({
            displayName: 'Last Name',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'A list of tags to apply to the subscriber.',
            required: false,
        }),
        update_existing: Property.Checkbox({
            displayName: 'Update Existing Subscriber',
            description: 'If the subscriber already exists, update their information. If unchecked, existing subscribers will be ignored.',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { list_id, email, status, first_name, last_name, tags, update_existing } = context.propsValue;
        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        const member = {
            email_address: email,
            status: status,
            merge_fields: {
                ...(first_name && { FNAME: first_name }),
                ...(last_name && { LNAME: last_name }),
            },
            ...(tags && tags.length > 0 && {
                tags: tags.map((tag) => (tag as string).trim()),
            }),
        };

        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).lists.batchListMembers(list_id, {
            members: [member],
            update_existing: update_existing,
        });
    },
});