import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { cleanPayload, salesloftRequest } from '../common/client';
import { accountIdProp, personIdProp, userIdProp } from '../common/props';

export const updatePersonAction = createAction({
  name: 'update_person',
  displayName: 'Update Person',
  description: 'Update an existing person in Salesloft.',
  auth: salesloftAuth,
  props: {
    person_id: personIdProp,
    email_address: Property.ShortText({
      displayName: 'Email Address',
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
      method: HttpMethod.PUT,
      path: `/people/${encodeURIComponent(String(propsValue.person_id))}`,
      body,
    });
  },
});
