import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../auth';

export const createAudience = createAction({
  auth: mailchimpAuth,
  name: 'create_audience',
  displayName: 'Create Audience (List)',
  description: 'Create a new audience (list) in Mailchimp',
  props: {
    name: Property.ShortText({
      displayName: 'Audience Name',
      description: 'The name of the audience',
      required: true,
    }),
    contact_company: Property.ShortText({
      displayName: 'Company Name',
      description: 'The company name for the list',
      required: true,
    }),
    contact_address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'The street address for the list contact',
      required: true,
    }),
    contact_city: Property.ShortText({
      displayName: 'City',
      description: 'The city for the list contact',
      required: true,
    }),
    contact_state: Property.ShortText({
      displayName: 'State/Province',
      description: 'The state or province for the list contact',
      required: true,
    }),
    contact_zip: Property.ShortText({
      displayName: 'Postal Code',
      description: 'The postal code for the list contact',
      required: true,
    }),
    contact_country: Property.ShortText({
      displayName: 'Country',
      description: 'A two-character ISO3166 country code',
      required: true,
    }),
    permission_reminder: Property.ShortText({
      displayName: 'Permission Reminder',
      description: 'The permission reminder for the list',
      required: true,
    }),
    campaign_defaults_from_name: Property.ShortText({
      displayName: 'Default From Name',
      description: 'The default from name for campaigns sent to this list',
      required: true,
    }),
    campaign_defaults_from_email: Property.ShortText({
      displayName: 'Default From Email',
      description: 'The default from email for campaigns sent to this list',
      required: true,
    }),
    campaign_defaults_subject: Property.ShortText({
      displayName: 'Default Subject',
      description: 'The default subject line for campaigns sent to this list',
      required: true,
    }),
    campaign_defaults_language: Property.ShortText({
      displayName: 'Default Language',
      description: 'The default language for this lists forms',
      required: false,
      defaultValue: 'en',
    }),
    email_type_option: Property.Checkbox({
      displayName: 'Email Type Option',
      description: 'Whether the list supports multiple formats for emails',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    try {
      const listData = {
        name: context.propsValue.name,
        contact: {
          company: context.propsValue.contact_company,
          address1: context.propsValue.contact_address1,
          city: context.propsValue.contact_city,
          state: context.propsValue.contact_state,
          zip: context.propsValue.contact_zip,
          country: context.propsValue.contact_country,
        },
        permission_reminder: context.propsValue.permission_reminder,
        campaign_defaults: {
          from_name: context.propsValue.campaign_defaults_from_name,
          from_email: context.propsValue.campaign_defaults_from_email,
          subject: context.propsValue.campaign_defaults_subject,
          language: context.propsValue.campaign_defaults_language || 'en',
        },
        email_type_option: context.propsValue.email_type_option || false,
      };

      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        '/lists',
        'POST' as any,
        listData
      );

      return response.body;
    } catch (error) {
      throw new Error(`Failed to create audience: ${JSON.stringify(error)}`);
    }
  },
});
