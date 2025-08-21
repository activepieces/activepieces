import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const createCampaign = createAction({
    auth: mailchimpAuth,
    name: 'create_campaign',
    displayName: 'Create Campaign',
    description: 'Create a new campaign in Mailchimp',
    props: {
        type: Property.StaticDropdown({
            displayName: 'Campaign Type',
            description: 'The type of campaign to create.',
            required: true,
            options: {
                options: [
                    { label: 'Regular', value: 'regular' },
                    { label: 'Plain Text', value: 'plaintext' },
                    { label: 'RSS', value: 'rss' },
                    { label: 'Variate (A/B Test)', value: 'variate' },
                ],
            },
            defaultValue: 'regular',
        }),
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the campaign.',
            required: true,
        }),
        subject_line: Property.ShortText({
            displayName: 'Subject Line',
            description: 'The subject line for the campaign.',
            required: true,
        }),
        from_name: Property.ShortText({
            displayName: 'From Name',
            description: "The 'from' name on the campaign (not an email address).",
            required: true,
        }),
        reply_to: Property.ShortText({
            displayName: 'Reply-To Email',
            description: 'The reply-to email address for the campaign.',
            required: true,
        }),
        preview_text: Property.ShortText({
            displayName: 'Preview Text',
            description: 'The preview text for the campaign.',
            required: false,
        }),
    },
    async run(context) {
        const { type, list_id, title, subject_line, from_name, reply_to, preview_text } = context.propsValue;
        const access_token = context.auth.access_token;
        const mailChimpServerPrefix =
            await mailchimpCommon.getMailChimpServerPrefix(access_token);

        mailchimp.setConfig({
            accessToken: access_token,
            server: mailChimpServerPrefix,
        });
        
        return await (mailchimp as any).campaigns.create({
            type: type,
            recipients: {
                list_id: list_id!,
            },
            settings: {
                subject_line: subject_line,
                preview_text: preview_text || '',
                title: title,
                from_name: from_name,
                reply_to: reply_to,
            },
        });
    },
});