import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const createList = createAction({
    auth: mailchimpAuth,
    name: 'create_list',
    displayName: 'Create List (Audience)',
    description: 'Creates a new list (now called an audience) in Mailchimp.',
    props: {
        name: Property.ShortText({
            displayName: 'Audience Name',
            required: true,
        }),
        company: Property.ShortText({
            displayName: 'Company',
            description: 'The company name to associate with the audience.',
            required: true,
        }),
        address1: Property.ShortText({
            displayName: 'Address 1',
            required: true,
        }),
        city: Property.ShortText({
            displayName: 'City',
            required: true,
        }),
        state: Property.ShortText({
            displayName: 'State / Province / Region',
            required: true,
        }),
        zip: Property.ShortText({
            displayName: 'Zip / Postal Code',
            required: true,
        }),
        country: Property.StaticDropdown({
            displayName: 'Country',
            required: true,
            options: {
                options: [
                    { "label": "United States", "value": "US" },
                    { "label": "United Kingdom", "value": "GB" },
                    { "label": "Canada", "value": "CA" },
                    { "label": "Australia", "value": "AU" },
                    { "label": "India", "value": "IN" },
                    { "label": "Germany", "value": "DE" },
                    { "label": "France", "value": "FR" },
                ]
            }
        }),
        phone: Property.ShortText({
            displayName: 'Phone',
            required: false,
        }),
        permission_reminder: Property.LongText({
            displayName: 'Permission Reminder',
            description: 'A message explaining how subscribers joined the audience (e.g., "You are receiving this email because you opted in via our website.").',
            required: true,
        }),
        from_name: Property.ShortText({
            displayName: 'Default "From" Name',
            description: 'The default "from" name for campaigns sent to this audience.',
            required: true,
        }),
        from_email: Property.ShortText({
            displayName: 'Default "From" Email',
            description: 'The default "from" email for campaigns sent to this audience.',
            required: true,
        }),
        subject: Property.ShortText({
            displayName: 'Default Subject Line',
            description: 'The default subject line for campaigns sent to this audience.',
            required: true,
        }),
        language: Property.ShortText({
            displayName: 'Language',
            description: 'The default language for the audience\'s forms (e.g., "en", "es", "fr").',
            required: true,
            defaultValue: 'en',
        }),
        email_type_option: Property.Checkbox({
            displayName: 'Enable HTML and Plain-Text Emails',
            description: 'If checked, subscribers can choose their email format. If unchecked, they receive HTML with a plain-text backup.',
            required: true,
            defaultValue: true,
        }),
        double_optin: Property.Checkbox({
            displayName: 'Require Double Opt-In',
            description: 'If checked, subscribers must confirm their subscription via email.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { name, company, address1, city, state, zip, country, phone, permission_reminder, from_name, from_email, subject, language, email_type_option, double_optin } = context.propsValue;

        const accessToken = context.auth.access_token;
        const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        mailchimp.setConfig({
            accessToken: accessToken,
            server: serverPrefix,
        });

        const listData = {
            name: name,
            contact: {
                company: company,
                address1: address1,
                city: city,
                state: state,
                zip: zip,
                country: country,
                phone: phone || '',
            },
            permission_reminder: permission_reminder,
            campaign_defaults: {
                from_name: from_name,
                from_email: from_email,
                subject: subject,
                language: language,
            },
            email_type_option: email_type_option,
            double_optin: double_optin,
        };

        // The SDK types are incomplete, so we cast to 'any'.
        return await (mailchimp as any).lists.createList(listData);
    },
});