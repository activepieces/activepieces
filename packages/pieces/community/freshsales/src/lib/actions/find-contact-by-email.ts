import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesClient } from '../common/client';
import { freshsalesRecords } from '../common/records';
import { findContactOutputSchema } from '../output-schemas';

export const findContactByEmail = createAction({
  auth: freshsalesAuth,
  name: 'find_contact_by_email',
  displayName: 'Find Contact by Email',
  description: 'Look up a contact by exact email address',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Looks up a Freshsales contact by exact email address. Returns found true with the first matching contact, or found false with contact null when nobody has that email. Use it to get a contact ID before Update Contact or Add Note.',
    idempotent: true,
  },
  outputSchema: findContactOutputSchema,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Exact email address to look up',
      placeholder: 'jane@acme.com',
      required: true,
    }),
  },
  async run(context) {
    const email = context.propsValue.email.trim();
    if (email.length === 0) {
      throw new Error('Email is required.');
    }
    const response = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/lookup',
      query: { q: email, f: 'email', entities: 'contact' },
    });
    const group = freshsalesClient.isRecord(response) ? response['contacts'] : undefined;
    const contacts = freshsalesClient.readArray({ body: group, key: 'contacts' });
    const first = contacts.find((item) => freshsalesClient.isRecord(item));
    if (!freshsalesClient.isRecord(first)) {
      return { found: false, contact: null };
    }
    const id = freshsalesClient.requireId({ value: first['id'], field: 'Contact ID' });
    const detail = await freshsalesClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/api/contacts/${id}`,
      query: { include: freshsalesRecords.RECORD_INCLUDES.contacts },
    });
    return {
      found: true,
      contact: freshsalesRecords.shapeContact(
        freshsalesClient.unwrap({ body: detail, key: 'contact' })
      ),
    };
  },
});
