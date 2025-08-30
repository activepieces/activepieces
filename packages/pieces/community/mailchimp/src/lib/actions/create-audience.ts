import { createAction, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const createAudience = createAction({
  auth: mailchimpAuth,
  name: 'create_audience',
  displayName: 'Create Audience (List)',
  description: 'Create a new audience (list) in your Mailchimp account',
  props: {
    name: Property.ShortText({
      displayName: 'Audience Name',
      description: 'The name of the audience',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company Name',
      description: 'Company name for list contact information',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address for list contact information',
      required: true,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Additional address information (optional)',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City for list contact information',
      required: true,
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province for list contact information',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'ZIP or postal code for list contact information',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'A two-character ISO3166 country code',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Phone number for list contact information (optional)',
      required: false,
    }),
    permission_reminder: Property.LongText({
      displayName: 'Permission Reminder',
      description: 'The permission reminder for the list',
      required: true,
      defaultValue: 'You are receiving this email because you signed up for updates from us.',
    }),
    from_name: Property.ShortText({
      displayName: 'Default From Name',
      description: 'Default from name for campaigns',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'Default From Email',
      description: 'Default from email address for campaigns',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Default Subject',
      description: 'Default subject line for campaigns',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Default language for campaigns (e.g., "en", "es", "fr")',
      required: false,
      defaultValue: 'en',
    }),
    email_type_option: Property.Checkbox({
      displayName: 'Email Type Option',
      description: 'Whether the list supports multiple email formats (HTML/plain text)',
      required: false,
      defaultValue: true,
    }),
    use_archive_bar: Property.Checkbox({
      displayName: 'Use Archive Bar',
      description: 'Whether campaigns use the Archive Bar in archives by default',
      required: false,
      defaultValue: false,
    }),
    notify_on_subscribe: Property.ShortText({
      displayName: 'Notify on Subscribe',
      description: 'Email address to send subscribe notifications to (optional)',
      required: false,
    }),
    notify_on_unsubscribe: Property.ShortText({
      displayName: 'Notify on Unsubscribe',
      description: 'Email address to send unsubscribe notifications to (optional)',
      required: false,
    }),
    double_optin: Property.Checkbox({
      displayName: 'Double Opt-in',
      description: 'Whether to require subscriber confirmation via email',
      required: false,
      defaultValue: false,
    }),
    marketing_permissions: Property.Checkbox({
      displayName: 'Marketing Permissions',
      description: 'Whether the list has marketing permissions (GDPR) enabled',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken,
      server,
    });

    try {
      const listData = {
        name: context.propsValue.name,
        contact: {
          company: context.propsValue.company,
          address1: context.propsValue.address1,
          address2: context.propsValue.address2 || '',
          city: context.propsValue.city,
          state: context.propsValue.state || '',
          zip: context.propsValue.zip || '',
          country: context.propsValue.country,
          phone: context.propsValue.phone || '',
        },
        permission_reminder: context.propsValue.permission_reminder,
        campaign_defaults: {
          from_name: context.propsValue.from_name,
          from_email: context.propsValue.from_email,
          subject: context.propsValue.subject,
          language: context.propsValue.language || 'en',
        },
        email_type_option: context.propsValue.email_type_option,
        use_archive_bar: context.propsValue.use_archive_bar,
        notify_on_subscribe: context.propsValue.notify_on_subscribe || '',
        notify_on_unsubscribe: context.propsValue.notify_on_unsubscribe || '',
        double_optin: context.propsValue.double_optin,
        marketing_permissions: context.propsValue.marketing_permissions,
      };

      const list = await client.lists.createList(listData);

      return list;
    } catch (error: any) {
      throw new Error(`Failed to create audience: ${error.message || JSON.stringify(error)}`);
    }
  },
});
