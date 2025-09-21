import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../common/auth';
import { capsuleCrmClient } from '../common/client';
import { CreatePartyParams } from '../common/types';

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
        'The first name of the person. Only used if type is "Person".',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description:
        'The last name of the person. Only used if type is "Person".',
      required: false,
    }),
    organisationName: Property.ShortText({
      displayName: 'Organisation Name',
      description:
        'The name of the organisation. Only used if type is "Organisation".',
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

    const type = propsValue.type as 'person' | 'organisation';
    const contactData: Partial<CreatePartyParams> = {
      type: type,
      email: propsValue.email,
      phone: propsValue.phone,
    };

    if (type === 'person') {
      if (!propsValue.firstName || !propsValue.lastName) {
        throw new Error('First Name and Last Name are required for a Person.');
      }
      contactData.firstName = propsValue.firstName;
      contactData.lastName = propsValue.lastName;
    } else if (type === 'organisation') {
      if (!propsValue.organisationName) {
        throw new Error('Organisation Name is required for an Organisation.');
      }
      contactData.name = propsValue.organisationName;
    }

    return await capsuleCrmClient.createContact(
      auth,
      contactData as CreatePartyParams
    );
  },
});
