import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const createContact = createAction({
  auth: CapsuleCRMAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new Person or Organisation in Capsule CRM',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Choose whether this is a Person or Organisation',
      required: true,
      options: {
        options: [
          { label: 'Person', value: 'person' },
          { label: 'Organisation', value: 'organisation' },
        ],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
      description: "e.g. Mr, Ms, Dr etc.",
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    organisationName: Property.ShortText({
      displayName: 'Organisation Name',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    about: Property.LongText({
      displayName: 'About',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email Address',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    street: Property.ShortText({
      displayName: "Street Address",
      required: false,
    }),
    city: Property.ShortText({
      displayName: "City",
      required: false,
    }),
    state: Property.ShortText({
      displayName: "State / Region",
      required: false,
    }),
    zip: Property.ShortText({
      displayName: "Zip / Postal Code",
      required: false,
    }),
    country: Property.ShortText({
      displayName: "Country",
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma separated)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const party: any = {
      type: propsValue.type,
    };

    if (propsValue.type === 'person') {
      party.firstName = propsValue.firstName;
      party.lastName = propsValue.lastName;
      if (propsValue.title) party.title = propsValue.title;
      if (propsValue.jobTitle) party.jobTitle = propsValue.jobTitle;
    } else if (propsValue.type === 'organisation') {
      party.name = propsValue.organisationName;
    }

    if (propsValue.about) party.about = propsValue.about;

    if (propsValue.email) {
      party.emailAddresses = [{ address: propsValue.email, type: 'Work' }];
    }

    if (propsValue.phone) {
      party.phoneNumbers = [{ number: propsValue.phone, type: 'Work' }];
    }

    const addressFields = ["street", "city", "state", "zip", "country"];
    const address: any = {};
    let hasAddress = false;
    addressFields.forEach(field => {
      const val = (party as any)[field];
      if (val) {
        hasAddress = true;
        address[field] = val;
      }
    });
    if (hasAddress) {
      party.addresses = [address];
    }

    if (propsValue.tags) {
      party.tags = propsValue.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/parties',
      { party }
    );

    return response;
  },
});
