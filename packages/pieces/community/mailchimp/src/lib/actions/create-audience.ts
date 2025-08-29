import { mailchimpCommon } from '../common';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpAuth } from '../..';

export const createAudience = createAction({
  auth: mailchimpAuth,
  name: 'create_audience',
  displayName: 'Create Audience (List)',
  description: 'Create a new Mailchimp audience (list)',
  props: {
    audience_name: Property.ShortText({
      displayName: 'Audience Name',
      description: 'The name of the new audience',
      required: true,
    }),
    from_name: Property.ShortText({
      displayName: 'From Name',
      description: 'The default from name for emails sent to this audience',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'From Email',
      description: 'The default from email address for emails sent to this audience',
      required: true,
    }),
    subject_line: Property.ShortText({
      displayName: 'Subject Line',
      description: 'The subject line for emails sent to this audience',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'The language of the audience',
      required: true,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Russian', value: 'ru' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Chinese', value: 'zh' },
        ],
      },
    }),
    notify_on_subscribe: Property.ShortText({
      displayName: 'Notify on Subscribe',
      description: 'Email address to notify when someone subscribes (optional)',
      required: false,
    }),
    notify_on_unsubscribe: Property.ShortText({
      displayName: 'Notify on Unsubscribe',
      description: 'Email address to notify when someone unsubscribes (optional)',
      required: false,
    }),
    double_optin: Property.Checkbox({
      displayName: 'Double Opt-in',
      description: 'Whether to use double opt-in for new subscribers',
      required: false,
      defaultValue: true,
    }),
    marketing_permissions: Property.Checkbox({
      displayName: 'Marketing Permissions',
      description: 'Whether to include marketing permissions in emails',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const access_token = context.auth.access_token;
    const mailChimpServerPrefix = await mailchimpCommon.getMailChimpServerPrefix(access_token);
    
    mailchimp.setConfig({
      accessToken: access_token,
      server: mailChimpServerPrefix,
    });

    try {
      const audience = await (mailchimp as any).lists.createList({
        name: context.propsValue.audience_name!,
        contact: {
          company: '',
          address1: '',
          city: '',
          state: '',
          zip: '',
          country: '',
          phone: '',
        },
        permission_reminder: 'You are receiving this email because you signed up for updates from us.',
        use_archive_bar: true,
        campaign_defaults: {
          from_name: context.propsValue.from_name!,
          from_email: context.propsValue.from_email!,
          subject: context.propsValue.subject_line || '',
          language: context.propsValue.language,
        },
        notify_on_subscribe: context.propsValue.notify_on_subscribe || '',
        notify_on_unsubscribe: context.propsValue.notify_on_unsubscribe || '',
        double_optin: context.propsValue.double_optin,
        marketing_permissions: context.propsValue.marketing_permissions,
        email_type_option: false,
        visibility: 'pub',
      });

      return {
        success: true,
        audience_id: audience.id,
        audience_name: audience.name,
        audience_description: audience.description,
        from_name: audience.campaign_defaults?.from_name,
        from_email: audience.campaign_defaults?.from_email,
        subscriber_count: audience.stats?.member_count,
        created_at: audience.date_created,
      };
    } catch (e) {
      throw new Error(`Failed to create audience: ${JSON.stringify(e)}`);
    }
  },
});
