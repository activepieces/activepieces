import { createAction, Property } from '@activepieces/pieces-framework';
import { youcanbookmeAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createprofile = createAction({
  auth: youcanbookmeAuth,
  name: 'create-profile',
  displayName: 'Create Profile',
  description: 'Create a new profile in YouCanBookMe',
  props: {
    accountId: Property.ShortText({
      displayName: 'Account ID',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Profile Title',
      description: 'The title of the profile',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of the profile',
      required: false,
    }),
    subdomain: Property.ShortText({
      displayName: 'Subdomain',
      description: 'The subdomain for the profile',
      required: false,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description: 'The time zone for the profile (e.g., America/New_York)',
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'The locale for the profile (e.g., en-US)',
      required: false,
    }),
    logo: Property.ShortText({
      displayName: 'Logo URL',
      description: 'URL to the profile logo',
      required: false,
    }),
    accessCode: Property.ShortText({
      displayName: 'Access Code',
      description: 'An access code for the profile',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      accountId,
      title,
      description,
      subdomain,
      timeZone,
      locale,
      logo,
      accessCode,
    } = propsValue;

    const body: any = {
      accountId,
      title,
    };

    if (description) body.description = description;
    if (subdomain) body.subdomain = subdomain;
    if (timeZone) body.timeZone = timeZone;
    if (locale) body.locale = locale;
    if (logo) body.logo = logo;
    if (accessCode) body.accessCode = accessCode;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.youcanbook.me/v1/profiles',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
