import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { partyIdDropdown } from '../common/dropdown';


export const updateContact = createAction({
  auth: CapsuleCRMAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update fields of an existing Contact (Person or Organisation) in Capsule CRM',
  props: {
    partyId: partyIdDropdown,
    type: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Type of contact, if you want to change it (optional)',
      required: false,
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
      displayName: 'Street Address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Region',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Postal / Zip Code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags (comma separated)',
      required: false,
    }),

  },
  async run({ auth, propsValue }) {

    const partyUpdate: any = {};

    // Only set type if provided
    if (propsValue.type) {
      partyUpdate.type = propsValue.type;
    }

    if (propsValue.title !== undefined) {
      partyUpdate.title = propsValue.title;
    }
    if (propsValue.jobTitle !== undefined) {
      partyUpdate.jobTitle = propsValue.jobTitle;
    }
    if (propsValue.about !== undefined) {
      partyUpdate.about = propsValue.about;
    }
    if (propsValue.type === 'person') {
      if (propsValue.firstName !== undefined) {
        partyUpdate.firstName = propsValue.firstName;
      }
      if (propsValue.lastName !== undefined) {
        partyUpdate.lastName = propsValue.lastName;
      }
    } else if (propsValue.type === 'organisation') {
      if (propsValue.organisationName !== undefined) {
        partyUpdate.name = propsValue.organisationName;
      }
    }

    if (propsValue.email !== undefined) {
      partyUpdate.emailAddresses = [
        { address: propsValue.email, type: 'Work' }
      ];
    }

    if (propsValue.phone !== undefined) {
      partyUpdate.phoneNumbers = [
        { number: propsValue.phone, type: 'Work' }
      ];
    }

    // Address
    const addressFields = ['street', 'city', 'state', 'zip', 'country'];
    const address: any = {};
    let hasAddress = false;
    for (const field of addressFields) {
      const val = (propsValue as any)[field];
      if (val !== undefined && val !== '') {
        hasAddress = true;
        address[field] = val;
      }
    }
    if (hasAddress) {
      partyUpdate.addresses = [address];
    }

    if (propsValue.tags !== undefined) {
      const tagList = propsValue.tags
        .split(',')
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
      if (tagList.length > 0) {
        partyUpdate.tags = tagList;
      }
    }

    const body = { party: partyUpdate };

    const response = await makeRequest(
      auth as string,
      HttpMethod.PUT,
      `/parties/${propsValue.partyId}`,
      body
    );

    return response;
  },
});
