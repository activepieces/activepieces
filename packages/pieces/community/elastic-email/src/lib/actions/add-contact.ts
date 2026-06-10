import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import {
  CONSENT_TRACKING_OPTIONS,
  CONTACT_STATUS_OPTIONS,
} from '../common/constants';
import { listNamesProp } from '../common/props';

export const addContactAction = createAction({
  name: 'add_contact',
  displayName: 'Add Contact to Mailing List',
  description:
    'Add a new contact to one or more mailing lists in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    listNames: listNamesProp,
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial status of the contact.',
      required: false,
      options: {
        options: CONTACT_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description:
        'Key-value pairs of custom contact fields. Only existing custom fields will be saved.',
      required: false,
    }),
    consentIP: Property.ShortText({
      displayName: 'Consent IP',
      description:
        'IP address of consent. If not provided, your current public IP is used.',
      required: false,
    }),
    consentDate: Property.ShortText({
      displayName: 'Consent Date',
      description:
        'ISO 8601 date of consent. If not provided, current date is used.',
      required: false,
    }),
    consentTracking: Property.StaticDropdown({
      displayName: 'Consent Tracking',
      description: 'Consent tracking level. Defaults to "Unknown".',
      required: false,
      options: {
        options: CONSENT_TRACKING_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.listNames) {
      queryParams['listnames'] = Array.isArray(propsValue.listNames)
        ? propsValue.listNames.join(',')
        : String(propsValue.listNames);
    }

    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts',
      queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      body: [
        {
          Email: propsValue.email,
          Status: propsValue.status ?? undefined,
          FirstName: propsValue.firstName ?? undefined,
          LastName: propsValue.lastName ?? undefined,
          CustomFields: propsValue.customFields ?? undefined,
          Consent: {
            ConsentIP: propsValue.consentIP ?? undefined,
            ConsentDate: propsValue.consentDate ?? undefined,
            ConsentTracking: propsValue.consentTracking ?? undefined,
          },
        },
      ],
    });
  },
});
