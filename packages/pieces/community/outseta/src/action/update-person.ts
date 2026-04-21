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
      description: 'The UID of the person to update.',
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
      description: 'Job title (e.g. CEO, Engineer).',
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

    // Fetch full person with nested objects expanded to avoid wiping on PUT
    const person = await client.get<any>(
      `/api/v1/crm/people/${context.propsValue.personUid}?fields=*,MailingAddress.*,Account.*`
    );

    let changed = false;
    if (context.propsValue.email) {
      person.Email = context.propsValue.email;
      changed = true;
    }
    if (context.propsValue.firstName) {
      person.FirstName = context.propsValue.firstName;
      changed = true;
    }
    if (context.propsValue.lastName) {
      person.LastName = context.propsValue.lastName;
      changed = true;
    }
    if (context.propsValue.phoneMobile) {
      person.PhoneMobile = context.propsValue.phoneMobile;
      changed = true;
    }
    if (context.propsValue.phoneWork) {
      person.PhoneWork = context.propsValue.phoneWork;
      changed = true;
    }
    if (context.propsValue.title) {
      person.Title = context.propsValue.title;
      changed = true;
    }

    const hasAddress =
      context.propsValue.addressLine1 ||
      context.propsValue.city ||
      context.propsValue.country;
    if (hasAddress) {
      const address = person.MailingAddress ?? {};
      if (context.propsValue.addressLine1)
        address.AddressLine1 = context.propsValue.addressLine1;
      if (context.propsValue.addressLine2)
        address.AddressLine2 = context.propsValue.addressLine2;
      if (context.propsValue.city) address.City = context.propsValue.city;
      if (context.propsValue.state) address.State = context.propsValue.state;
      if (context.propsValue.postalCode)
        address.PostalCode = context.propsValue.postalCode;
      if (context.propsValue.country)
        address.Country = context.propsValue.country;
      person.MailingAddress = address;
      changed = true;
    }

    if (!changed) {
      throw new Error('At least one field must be provided.');
    }

    const updatedPerson = await client.put<any>(
      `/api/v1/crm/people/${context.propsValue.personUid}`,
      person
    );

    return updatedPerson;
  },
});
