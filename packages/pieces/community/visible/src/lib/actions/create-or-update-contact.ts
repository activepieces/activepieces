import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { visibleAuth } from '../..';
import { visibleMakeRequest } from '../common';

export const createOrUpdateContact = createAction({
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Creates a contact (or updates contact based on email address).',
  audience: 'both',
  aiMetadata: {
    description: 'Upserts a contact in Visible: creates a new contact, or updates the existing one matched on the provided email address. Use to ensure a person exists under a company without first checking. Requires the email and the company ID; optional name, title, and contact list IDs. Idempotent because the email is the stable match key, so repeating the same input converges to the same contact.',
    idempotent: true,
  },
  auth: visibleAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    companyId: Property.ShortText({
      displayName: 'Company ID',
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
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    contactListIds: Property.Array({
      displayName: 'Contact List IDs',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const contact: Record<string, unknown> = {
      email: propsValue.email,
      company_id: propsValue.companyId,
      contact_list_ids: Array.isArray(propsValue.contactListIds)
        ? propsValue.contactListIds
        : [],
    };

    if (propsValue.firstName) {
      contact['first_name'] = propsValue.firstName;
    }

    if (propsValue.lastName) {
      contact['last_name'] = propsValue.lastName;
    }

    if (propsValue.title) {
      contact['title'] = propsValue.title;
    }

    return await visibleMakeRequest({
      accessToken: auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts',
      body: {
        contact,
      },
    });
  },
});
