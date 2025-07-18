import { createAction, Property } from '@activepieces/pieces-framework';
import { helpScoutApiRequest } from '../common/api';
import { helpScoutAuth } from '../common/auth';
import { propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateCustomerProperties = createAction({
  auth: helpScoutAuth,
  name: 'update_customer_properties',
  displayName: 'Update Customer Properties',
  description: 'Update a customer profile using the Help Scout PATCH array format (see API docs).',
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Add Email',
      required: false,
      description: 'Add a new email address to the customer',
    }),
    phone: Property.ShortText({
      displayName: 'Add Phone',
      required: false,
      description: 'Add a new phone number to the customer',
    }),
    photoUrl: Property.ShortText({
      displayName: 'Photo URL',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      required: false,
    }),
    age: Property.Number({
      displayName: 'Age',
      required: false,
    }),
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
          { label: 'Other', value: 'other' },
        ],
      },
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    socialProfile: Property.ShortText({
      displayName: 'Add Social Profile URL',
      required: false,
      description: 'Add a new social profile URL to the customer',
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      customerId: z.string().min(1, 'Customer ID is required.'),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      email: z.string().email('Please provide a valid email address.').optional(),
      phone: z.string().optional(),
      photoUrl: z.string().url('Photo URL must be a valid URL.').optional(),
      jobTitle: z.string().optional(),
      location: z.string().optional(),
      background: z.string().optional(),
      age: z.number().int().positive('Age must be a positive integer.').optional(),
      gender: z.enum(['male', 'female', 'other']).optional(),
      organization: z.string().optional(),
      socialProfile: z.string().url('Social profile must be a valid URL.').optional(),
    });
    const patchOps: any[] = [];
    if (propsValue.firstName) {
      patchOps.push({ op: 'replace', path: '/firstName', value: propsValue.firstName });
    }
    if (propsValue.lastName) {
      patchOps.push({ op: 'replace', path: '/lastName', value: propsValue.lastName });
    }
    if (propsValue.email) {
      patchOps.push({ op: 'add', path: '/emails', value: { type: 'other', value: propsValue.email } });
    }
    if (propsValue.phone) {
      patchOps.push({ op: 'add', path: '/phones', value: { type: 'other', value: propsValue.phone } });
    }
    if (propsValue.photoUrl) {
      patchOps.push({ op: 'replace', path: '/photoUrl', value: propsValue.photoUrl });
    }
    if (propsValue.jobTitle) {
      patchOps.push({ op: 'replace', path: '/jobTitle', value: propsValue.jobTitle });
    }
    if (propsValue.location) {
      patchOps.push({ op: 'replace', path: '/location', value: propsValue.location });
    }
    if (propsValue.background) {
      patchOps.push({ op: 'replace', path: '/background', value: propsValue.background });
    }
    if (propsValue.age) {
      patchOps.push({ op: 'replace', path: '/age', value: propsValue.age });
    }
    if (propsValue.gender) {
      patchOps.push({ op: 'replace', path: '/gender', value: propsValue.gender });
    }
    if (propsValue.organization) {
      patchOps.push({ op: 'replace', path: '/organization', value: propsValue.organization });
    }
    if (propsValue.socialProfile) {
      patchOps.push({ op: 'add', path: '/social-profiles', value: { type: 'other', value: propsValue.socialProfile } });
    }
    if (patchOps.length === 0) {
      throw new Error('At least one field to update must be provided.');
    }
    return await helpScoutApiRequest({
      method: HttpMethod.PATCH,
      url: `/customers/${propsValue.customerId}`,
      auth,
      body: patchOps,
    });
  },
}); 