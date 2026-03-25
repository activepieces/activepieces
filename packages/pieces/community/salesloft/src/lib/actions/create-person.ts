import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { cleanPayload, salesloftRequest } from '../common/client';
import { accountIdProp, userIdProp } from '../common/props';

export const createPersonAction = createAction({
  name: 'create_person',
  displayName: 'Create Person',
  description:
    'Create a new person in Salesloft. Either email_address or phone + last_name must be provided.',
  auth: salesloftAuth,
  props: {
    email_address: Property.ShortText({
      displayName: 'Email Address',
      description:
        'Primary email address. Either this or Phone + Last Name is required.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description:
        'Phone number. Required along with Last Name when Email Address is not provided.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    linkedin_url: Property.ShortText({
      displayName: 'LinkedIn URL',
      required: false,
    }),
    account_id: accountIdProp,
    owner_id: userIdProp,
  },
  async run({ auth, propsValue }) {
    const hasEmail = propsValue.email_address?.trim();
    const hasPhoneAndLastName =
      propsValue.phone?.trim() && propsValue.last_name?.trim();

    if (!hasEmail && !hasPhoneAndLastName) {
      throw new Error(
        'Either email_address or both phone and last_name must be provided to create a person.',
      );
    }

    const body = cleanPayload({
      email_address: propsValue.email_address,
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      phone: propsValue.phone,
      title: propsValue.title,
      company_name: propsValue.company_name,
      city: propsValue.city,
      state: propsValue.state,
      country: propsValue.country,
      linkedin_url: propsValue.linkedin_url,
      account_id: propsValue.account_id
        ? Number(propsValue.account_id)
        : undefined,
      owner_id: propsValue.owner_id
        ? Number(propsValue.owner_id)
        : undefined,
    });

    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/people',
      body,
    });
  },
});
