import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';

export const createContactAction = createAction({
  auth: capsuleCrmAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new Person or Organisation in Capsule CRM.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'The type of contact to create.',
      required: true,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Organisation', value: 'organisation' },
        ],
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description:
        'The first name of the person. Required if type is "Person".',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the person. Required if type is "Person".',
      required: false,
    }),
    organisationName: Property.ShortText({
      displayName: 'Organisation Name',
      description:
        'The name of the organisation. Required if type is "Organisation".',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The primary email address for the contact.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'The primary phone number for the contact.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    if (propsValue.type === 'person') {
      if (!propsValue.firstName || !propsValue.lastName) {
        throw new Error('First Name and Last Name are required for a Person.');
      }
    } else {
      if (!propsValue.organisationName) {
        throw new Error('Organisation Name is required for an Organisation.');
      }
    }

    return await capsuleCrmClient.createContact(auth, {
      type: propsValue.type as 'person' | 'organisation',
      firstName: propsValue.firstName,
      lastName: propsValue.lastName,
      name: propsValue.organisationName,
      email: propsValue.email,
      phone: propsValue.phone,
    });
  },
});
