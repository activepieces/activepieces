import { createAction, Property } from '@activepieces/pieces-framework';

import { kustomerAuth } from '../common/auth';
import { kustomerClient } from '../common/client';
import { kustomerUtils } from '../common/utils';
import { KustomerJsonObject, KustomerJsonValue } from '../common/types';

export const createCustomerAction = createAction({
  auth: kustomerAuth,
  name: 'create-customer',
  displayName: 'Create Customer',
  description: 'Creates a new customer record in Kustomer.',
  props: {
    name: Property.ShortText({
      displayName: 'Full Name',
      description: 'The customer\'s full name (e.g. "Jane Doe").',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'Primary email address of the customer.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Primary phone number in E.164 format (e.g. "+14155551234").',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'Name of the company the customer belongs to.',
      required: false,
    }),
    externalId: Property.ShortText({
      displayName: 'External ID',
      description:
        'Unique identifier from your own system (e.g. your CRM or database ID). Used to link this Kustomer record back to your data.',
      required: false,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: "The customer's username in your system.",
      required: false,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description:
        'Language/locale code for the customer (e.g. "en_US", "fr_FR", "de_DE").',
      required: false,
    }),
    timeZone: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'IANA timezone identifier (e.g. "America/New_York", "Europe/London", "Asia/Tokyo").',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: "The customer's gender.",
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'm' },
          { label: 'Female', value: 'f' },
        ],
      },
    }),
    birthdayAt: Property.ShortText({
      displayName: 'Birthday',
      description:
        'Customer\'s birth date in ISO 8601 format (e.g. "1990-06-15T00:00:00.000Z").',
      required: false,
    }),
    signedUpAt: Property.ShortText({
      displayName: 'Signed Up At',
      description:
        'When the customer registered, in ISO 8601 format (e.g. "2024-01-15T10:30:00.000Z").',
      required: false,
    }),
    avatarUrl: Property.ShortText({
      displayName: 'Avatar URL',
      description: "URL of the customer's profile image.",
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text as string;
    const props = context.propsValue;

    const customer: KustomerJsonObject = {};

    if (props.name) customer['name'] = props.name;
    if (props.company) customer['company'] = props.company;
    if (props.externalId) customer['externalId'] = props.externalId;
    if (props.username) customer['username'] = props.username;
    if (props.locale) customer['locale'] = props.locale;
    if (props.timeZone) customer['timeZone'] = props.timeZone;
    if (props.gender) customer['gender'] = props.gender;
    if (props.birthdayAt) customer['birthdayAt'] = props.birthdayAt;
    if (props.signedUpAt) customer['signedUpAt'] = props.signedUpAt;
    if (props.avatarUrl) customer['avatarUrl'] = props.avatarUrl;
    if (props.email) customer['emails'] = [{ email: props.email }];
    if (props.phone) customer['phones'] = [{ phone: props.phone }];

    const response = await kustomerClient.createCustomer({ apiKey, customer });

    return response;
  },
});
