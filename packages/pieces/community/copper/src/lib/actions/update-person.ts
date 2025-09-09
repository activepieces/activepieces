import { createAction, Property } from '@activepieces/pieces-framework';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updatePerson = createAction({
  auth: copperAuth,
  name: 'copper_update_person',
  displayName: 'Update Person',
  description: 'Update an existing person/contact in Copper',
  props: {
    person_id: Property.ShortText({
      displayName: 'Person ID',
      description: 'ID of the person to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The full name of the person',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Email addresses for the person',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        category: Property.StaticDropdown({
          displayName: 'Category',
          required: false,
          defaultValue: 'work',
          options: {
            options: [
              { label: 'Work', value: 'work' },
              { label: 'Personal', value: 'personal' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    phone_numbers: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the person',
      required: false,
      properties: {
        number: Property.ShortText({
          displayName: 'Phone Number',
          required: true,
        }),
        category: Property.StaticDropdown({
          displayName: 'Category',
          required: false,
          defaultValue: 'work',
          options: {
            options: [
              { label: 'Work', value: 'work' },
              { label: 'Mobile', value: 'mobile' },
              { label: 'Home', value: 'home' },
              { label: 'Other', value: 'other' },
            ],
          },
        }),
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title or position',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      description: 'Name of the company they work for',
      required: false,
    }),
    details: Property.LongText({
      displayName: 'Details',
      description: 'Additional details about the person',
      required: false,
    }),
  },
  async run(context) {
    const { person_id, name, emails, phone_numbers, title, company_name, details } = context.propsValue;

    const body: any = {};

    if (name) body.name = name;
    if (emails && emails.length > 0) body.emails = emails;
    if (phone_numbers && phone_numbers.length > 0) body.phone_numbers = phone_numbers;
    if (title) body.title = title;
    if (company_name) body.company_name = company_name;
    if (details) body.details = details;

    const response = await copperRequest({
      auth: context.auth,
      method: HttpMethod.PUT,
      url: `/people/${person_id}`,
      body,
    });

    return response;
  },
});
