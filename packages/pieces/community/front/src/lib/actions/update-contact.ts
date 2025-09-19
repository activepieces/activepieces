import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { frontProps } from '../common/props'; 

export const updateContact = createAction({
  auth: frontAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Modify the fields of an existing contact.',
  props: {
    contact_id: frontProps.contact({ required: true }), 
    name: Property.ShortText({
      displayName: 'Name',
      description: "The contact's full name.",
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'An optional description for the contact.',
      required: false,
    }),
    list_names: Property.Array({
      displayName: 'Contact Lists',
      description: 'List of contact list names to add this contact to.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description:
        'IMPORTANT: This will replace all existing custom fields. Provide a complete JSON object of all fields you want to keep.',
      required: false,
    }),
  },
  async run(context) {
    const { contact_id, ...body } = context.propsValue;
    const token = context.auth;

    Object.keys(body).forEach(
      (key) =>
        (body as Record<string, unknown>)[key] === undefined &&
        delete (body as Record<string, unknown>)[key]
    );

    await makeRequest(token, HttpMethod.PATCH, `/contacts/${contact_id}`, body);

    return { success: true };
  },
});
