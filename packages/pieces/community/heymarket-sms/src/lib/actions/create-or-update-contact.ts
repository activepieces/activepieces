import { createAction, Property } from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface CustomField {
  [key: string]: string | number | boolean;
}

interface Tag {
  tag_id: number;
}

export const createOrUpdateContact = createAction({
  auth: heymarketSmsAuth,
  name: 'createOrUpdateContact',
  displayName: 'Create or Update Contact',
  description:
    'Create a new contact or update an existing contact by phone number',
  props: {
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in E.164 format without the plus sign (e.g. 14155553434)',
      required: true,
    }),
    first: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    last: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'Display name of the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Array of tags',
      required: false,
      properties: {
        tag_id: Property.Number({
          displayName: 'Tag ID',
          description: 'Unique identifier for the tag',
          required: true,
        }),
      },
    }),
    is_opted_out: Property.Checkbox({
      displayName: 'Is Opted Out',
      description: 'Whether the contact is opted out of messaging',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description:
        'Contact ID for updating an existing contact. If not provided, will attempt to create a new contact',
      required: false,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite Custom Fields',
      description:
        'When true, replaces all existing custom fields. When false, merges with existing ones. Note: contact name is always overwritten',
      required: false,
    }),
  },
  async run(context) {
    const {
      phone,
      first,
      last,
      display_name,
      email,

      tags,
      is_opted_out,
      contact_id,
      overwrite,
    } = context.propsValue;

    // Build request body
    const body: any = {
      phone,
    };

    if (first) body.first = first;
    if (last) body.last = last;
    if (display_name) body.display_name = display_name;
    if (email) body.email = email;

    if (tags) body.tags = tags;
    if (is_opted_out !== undefined) body.is_opted_out = is_opted_out;

    let response;

    if (contact_id) {
      // Update existing contact
      const queryParams = overwrite ? '?overwrite=true' : '';
      response = await makeRequest(
        context.auth.secret_text,
        HttpMethod.PUT,
        `/v1/contact/${contact_id}${queryParams}`,
        body
      );
    } else {
      // Create new contact
      response = await makeRequest(
        context.auth.secret_text,
        HttpMethod.POST,
        '/v1/contact',
        body
      );
    }

    return response;
  },
});
