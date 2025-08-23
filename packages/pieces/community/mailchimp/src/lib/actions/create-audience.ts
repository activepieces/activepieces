import { createAction, Property } from '@activepieces/pieces-framework';
import {
  getAccessTokenOrThrow,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { mailchimpAuth } from '../..';
import { mailchimpCommon } from '../common';

export const mailChimpCreateAudience = createAction({
  auth: mailchimpAuth,
  name: 'create-audience',
  displayName: 'Create Audience',
  description: 'Creates a new audience (list).',
  props: {
    name: Property.ShortText({ displayName: 'Audience Name', required: true }),
    from_name: Property.ShortText({
      displayName: 'Default From Name',
      required: true,
    }),
    from_email: Property.ShortText({
      displayName: 'Default From Email',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Default Subject',
      required: false,
    }),
    permission_reminder: Property.ShortText({
      displayName: 'Permission Reminder',
      description:
        'e.g., You are receiving this email because you signed up on our website.',
      required: true,
    }),
    company: Property.ShortText({ displayName: 'Company', required: true }),
    address1: Property.ShortText({ displayName: 'Address 1', required: true }),
    city: Property.ShortText({ displayName: 'City', required: true }),
    state: Property.ShortText({
      displayName: 'State/Province',
      required: true,
    }),
    zip: Property.ShortText({ displayName: 'ZIP/Postal', required: true }),
    country: Property.ShortText({
      displayName: 'Country (2-letter code)',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language (e.g., en)',
      required: false,
    }),
  },
  async run(ctx) {
    const token = getAccessTokenOrThrow(ctx.auth);
    const server = await mailchimpCommon.getMailChimpServerPrefix(token);

    const body = {
      name: ctx.propsValue.name!,
      contact: {
        company: ctx.propsValue.company!,
        address1: ctx.propsValue.address1!,
        city: ctx.propsValue.city!,
        state: ctx.propsValue.state!,
        zip: ctx.propsValue.zip!,
        country: ctx.propsValue.country!,
      },
      permission_reminder: ctx.propsValue.permission_reminder!,
      campaign_defaults: {
        from_name: ctx.propsValue.from_name!,
        from_email: ctx.propsValue.from_email!,
        subject: ctx.propsValue.subject ?? '',
        language: ctx.propsValue.language ?? 'en',
      },
      email_type_option: false,
    };

    const resp = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://${server}.api.mailchimp.com/3.0/lists`,
      headers: { Authorization: `OAuth ${token}` },
      body,
    });

    return resp.body;
  },
});
