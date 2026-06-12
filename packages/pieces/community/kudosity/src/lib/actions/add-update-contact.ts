import { createAction, Property } from '@activepieces/pieces-framework';
import { kudosityAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const addUpdateContact = createAction({
  auth: kudosityAuth,
  name: 'addUpdateContact',
  displayName: 'Add / Update Contact',
  description: 'Create or update a list member in Kudosity',
  audience: 'both',
  aiMetadata: {
    description:
      'Upsert a contact (list member) in a Kudosity recipient list, keyed on the MSISDN phone number — creates the member if absent or updates their fields if already present. Use to add subscribers or keep contact details in sync. Requires the numeric list ID, the MSISDN (phone with country code), and an email. Safe to repeat: the same input produces the same final record.',
    idempotent: true,
  },
  props: {
    listId: Property.ShortText({
      displayName: 'List ID',
      description:
        'Numeric ID of the recipient list (found in the list page URL).',
      required: true,
    }),
    msisdn: Property.ShortText({
      displayName: 'MSISDN',
      description: 'Phone number with country code, e.g., +1234567890',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom fields',
      required: false,
    }),
  },
  async run(context) {
    const payload = {
      list_id: context.propsValue.listId,
      msisdn: context.propsValue.msisdn,
      email: context.propsValue.email,
      first_name: context.propsValue.firstName,
      last_name: context.propsValue.lastName,
      phone: context.propsValue.phone,
      custom_fields: context.propsValue.customFields,
    };

    const res = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/edit-list-member.json',
      payload
    );

    return res;
  },
});
