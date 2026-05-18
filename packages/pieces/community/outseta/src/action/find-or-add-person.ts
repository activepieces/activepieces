import { createAction, Property } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';

export const findOrAddPersonAction = createAction({
  name: 'find_or_add_person',
  auth: outsetaAuth,
  displayName: 'Find or Add Person',
  description:
    'Search for a person by email. If not found, create a new one.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
      description: 'Email to search for. If no match is found, a new person is created with this email.',
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

    const searchResult = await client.get<any>(
      `/api/v1/crm/people?Email=${encodeURIComponent(context.propsValue.email)}&$top=100`
    );

    const items = searchResult?.items ?? searchResult?.Items ?? [];
    const exactMatch = items.find(
      (item: any) =>
        item.Email?.toLowerCase() === context.propsValue.email.toLowerCase()
    );
    if (exactMatch) {
      return { created: false, person: exactMatch };
    }

    const body: Record<string, unknown> = {
      Email: context.propsValue.email,
    };
    if (context.propsValue.firstName) body['FirstName'] = context.propsValue.firstName;
    if (context.propsValue.lastName) body['LastName'] = context.propsValue.lastName;
    if (context.propsValue.phoneMobile) body['PhoneMobile'] = context.propsValue.phoneMobile;
    if (context.propsValue.phoneWork) body['PhoneWork'] = context.propsValue.phoneWork;

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

    const newPerson = await client.post<any>('/api/v1/crm/people', body);
    return { created: true, person: newPerson };
  },
});
