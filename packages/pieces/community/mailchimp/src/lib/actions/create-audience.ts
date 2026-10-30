import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { MailchimpClient } from '../common/types';

export const createAudience = createAction({
  auth: mailchimpAuth,
  name: 'create_audience',
  classification: 'WRITE',
  displayName: 'Create Audience',
  description: 'Create a new audience in your Mailchimp account',
  audience: 'both',
  aiMetadata: { description: 'Creates a new audience (list) in the Mailchimp account, including the required physical contact address, permission reminder, and default campaign sender settings. Use to provision a brand-new list to hold subscribers. Not idempotent: each call creates a separate audience even with identical input.', idempotent: false },
  propertyGroups: [
    {
      key: 'audience',
      display: 'section',
      label: 'Audience',
      icon: 'inbox',
      props: ['name', 'permission_reminder'],
    },
    {
      key: 'contact',
      display: 'section',
      label: 'Contact Details',
      icon: 'location',
      props: ['contact_info', 'company', 'address1', 'address2', 'city', 'state', 'zip', 'country', 'phone'],
    },
    {
      key: 'defaults',
      display: 'section',
      label: 'Campaign Defaults',
      icon: 'send',
      props: ['from_name', 'from_email', 'subject', 'language'],
    },
    {
      key: 'settings',
      display: 'section',
      label: 'Settings',
      icon: 'sliders',
      props: ['double_optin', 'marketing_permissions', 'email_type_option', 'use_archive_bar'],
    },
    {
      key: 'notify',
      display: 'section',
      label: 'Notifications',
      icon: 'inbox',
      props: ['notify_on_subscribe', 'notify_on_unsubscribe'],
    },
  ],
  props: {
    contact_info: Property.MarkDown({
      value: 'Mailchimp shows this address in the footer of every email.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Audience Name',
      placeholder: 'Newsletter',
      required: true,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      placeholder: 'Acme Inc.',
      required: true,
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      placeholder: '123 Main St',
      required: true,
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      placeholder: 'Suite 100',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      placeholder: 'Springfield',
      required: true,
      width: 'half',
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      placeholder: 'IL',
      required: false,
      width: 'half',
    }),
    zip: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      placeholder: '62701',
      required: false,
      width: 'half',
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter country code.',
      placeholder: 'US',
      required: true,
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      placeholder: '+1 555 0100',
      required: false,
    }),
    permission_reminder: Property.LongText({
      displayName: 'Permission Reminder',
      description: 'Reminds subscribers how they joined the audience.',
      required: true,
      defaultValue: 'You are receiving this email because you signed up for updates from us.',
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      placeholder: 'Acme Newsletter',
      required: true,
      width: 'half',
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      placeholder: 'news@acme.com',
      required: true,
      width: 'half',
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'Default subject line for new campaigns.',
      placeholder: 'Our latest news',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Two-letter language code.',
      placeholder: 'en',
      required: true,
      defaultValue: 'en',
    }),
    email_type_option: Property.Checkbox({
      displayName: 'Email Type Option',
      description: 'Let subscribers choose HTML or plain-text emails.',
      required: false,
      defaultValue: true,
    }),
    use_archive_bar: Property.Checkbox({
      displayName: 'Use Archive Bar',
      description: 'Show the archive bar on campaign archive pages.',
      required: false,
      defaultValue: false,
    }),
    notify_on_subscribe: Property.ShortText({
      displayName: 'Notify on Subscribe',
      description: 'Gets an email for each new subscriber.',
      placeholder: 'you@acme.com',
      required: false,
    }),
    notify_on_unsubscribe: Property.ShortText({
      displayName: 'Notify on Unsubscribe',
      description: 'Gets an email for each unsubscribe.',
      placeholder: 'you@acme.com',
      required: false,
    }),
    double_optin: Property.Checkbox({
      displayName: 'Double Opt-in',
      description: 'Ask new subscribers to confirm by email.',
      required: false,
      defaultValue: false,
    }),
    marketing_permissions: Property.Checkbox({
      displayName: 'Marketing Permissions',
      description: 'Turn on GDPR marketing permission fields.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const accessToken = getAccessTokenOrThrow(context.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
    
    const client = mailchimp as unknown as MailchimpClient;
    client.setConfig({
      accessToken: accessToken,
      server: server,
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
          language: context.propsValue.language,
        },
        email_type_option: context.propsValue.email_type_option,
        use_archive_bar: context.propsValue.use_archive_bar,
        notify_on_subscribe: context.propsValue.notify_on_subscribe || '',
        notify_on_unsubscribe: context.propsValue.notify_on_unsubscribe || '',
        double_optin: context.propsValue.double_optin,
        marketing_permissions: context.propsValue.marketing_permissions,
      };

      const list = await client.lists.createList(listData);

      return {
        success: true,
        id: list.id,
        web_id: list.web_id,
        name: list.name,
        contact: list.contact,
        permission_reminder: list.permission_reminder,
        use_archive_bar: list.use_archive_bar,
        campaign_defaults: list.campaign_defaults,
        notify_on_subscribe: list.notify_on_subscribe,
        notify_on_unsubscribe: list.notify_on_unsubscribe,
        date_created: list.date_created,
        list_rating: list.list_rating,
        email_type_option: list.email_type_option,
        subscribe_url_short: list.subscribe_url_short,
        subscribe_url_long: list.subscribe_url_long,
        beamer_address: list.beamer_address,
        visibility: list.visibility,
        double_optin: list.double_optin,
        has_welcome: list.has_welcome,
        marketing_permissions: list.marketing_permissions,
        modules: list.modules,
        stats: list.stats,
        _links: list._links,
      };
    } catch (error: any) {
      throw new Error(`Failed to create list: ${error.message || JSON.stringify(error)}`);
    }
  },
});
