import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellAuth } from '../common/auth';
import {
  escapeJsonPointerSegment,
  JsonPatchOperation,
  nutshellApiCall,
  nutshellPatch,
  unwrapFirst,
} from '../common/client';

export const updateContact = createAction({
  auth: nutshellAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in Nutshell.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates fields on an existing Nutshell contact identified by its ID; only the supplied fields are changed. Email and phone, when provided, replace the contact\'s existing values for that field. Company and tag IDs are added as additional links rather than replacing existing ones. Idempotent: applying the same values repeatedly leaves the contact in the same state.',
    idempotent: true,
  },
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update, e.g. "123-contacts".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Replaces the contact\'s primary email address.',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Replaces the contact\'s primary phone number.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    addAccountIds: Property.Array({
      displayName: 'Company IDs to Add',
      description: 'IDs of companies to link to this contact, e.g. "12-accounts".',
      required: false,
    }),
    addTagIds: Property.Array({
      displayName: 'Tag IDs to Add',
      required: false,
    }),
    customFields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Key-value pairs matching custom field names configured in Nutshell. Each key is replaced with the provided value.',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, name, email, phone, description, addAccountIds, addTagIds, customFields } =
      context.propsValue;

    const operations: JsonPatchOperation[] = [];

    if (name !== undefined) {
      operations.push({ op: 'replace', path: '/contacts/0/name', value: name });
    }
    if (description !== undefined) {
      operations.push({ op: 'replace', path: '/contacts/0/description', value: description });
    }
    if (email !== undefined) {
      operations.push({
        op: 'replace',
        path: '/contacts/0/emails',
        value: [{ isPrimary: true, value: email }],
      });
    }
    if (phone !== undefined) {
      operations.push({
        op: 'replace',
        path: '/contacts/0/phones',
        value: [{ isPrimary: true, value: { number: phone } }],
      });
    }
    if (customFields) {
      for (const [key, value] of Object.entries(customFields as Record<string, unknown>)) {
        operations.push({
          op: 'replace',
          path: `/contacts/0/customFields/${escapeJsonPointerSegment(key)}`,
          value,
        });
      }
    }
    for (const id of addAccountIds ?? []) {
      operations.push({ op: 'add', path: '/contacts/0/links/accounts/-', value: id });
    }
    for (const id of addTagIds ?? []) {
      operations.push({ op: 'add', path: '/contacts/0/links/tags/-', value: id });
    }

    if (operations.length === 0) {
      throw new Error('Provide at least one field to update.');
    }

    await nutshellPatch({
      auth: context.auth,
      resourceUri: `/contacts/${contactId}`,
      operations,
    });

    const response = await nutshellApiCall({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: `/contacts/${contactId}`,
    });
    return unwrapFirst(response, 'contacts');
  },
});
