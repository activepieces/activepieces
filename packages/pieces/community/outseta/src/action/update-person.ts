import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const updatePersonAction = createAction({
  name: 'update_person',
  auth: outsetaAuth,
  displayName: 'Update Person',
  description: 'Update an existing person in Outseta.',
  props: {
    personUid: Property.ShortText({
      displayName: 'Person UID',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phoneMobile: Property.ShortText({
      displayName: 'Mobile #',
      required: false,
    }),
    phoneWork: Property.ShortText({
      displayName: 'Work #',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    addressLine1: Property.ShortText({
      displayName: 'Address Line 1',
      required: false,
    }),
    addressLine2: Property.ShortText({
      displayName: 'Address Line 2',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Region',
      required: false,
    }),
    postalCode: Property.ShortText({
      displayName: 'Postal Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const body: Record<string, unknown> = {};
    if (context.propsValue.email) body['Email'] = context.propsValue.email;
    if (context.propsValue.firstName) body['FirstName'] = context.propsValue.firstName;
    if (context.propsValue.lastName) body['LastName'] = context.propsValue.lastName;
    if (context.propsValue.phoneMobile) body['PhoneMobile'] = context.propsValue.phoneMobile;
    if (context.propsValue.phoneWork) body['PhoneWork'] = context.propsValue.phoneWork;
    if (context.propsValue.title) body['Title'] = context.propsValue.title;

    const hasAddress = context.propsValue.addressLine1 || context.propsValue.city || context.propsValue.country;
    if (hasAddress) {
      const address: Record<string, unknown> = {};
      if (context.propsValue.addressLine1) address['AddressLine1'] = context.propsValue.addressLine1;
      if (context.propsValue.addressLine2) address['AddressLine2'] = context.propsValue.addressLine2;
      if (context.propsValue.city) address['City'] = context.propsValue.city;
      if (context.propsValue.state) address['State'] = context.propsValue.state;
      if (context.propsValue.postalCode) address['PostalCode'] = context.propsValue.postalCode;
      if (context.propsValue.country) address['Country'] = context.propsValue.country;
      body['MailingAddress'] = address;
    }

    if (Object.keys(body).length === 0) {
      throw new Error('At least one field must be provided.');
    }

    return await client.put<any>(
      `/api/v1/crm/people/${context.propsValue.personUid}`,
      body
    );
  },
});
