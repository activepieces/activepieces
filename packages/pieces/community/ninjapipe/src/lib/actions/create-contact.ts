import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { NinjaPipeApiError, ninjapipeClient } from '../common/client';
import { ninjapipeContacts } from '../common/contact-props';
import { ninjapipeRecords } from '../common/records';
import { ninjapipeSchemas } from '../output-schemas';

export const createContact = createAction({
  auth: ninjapipeAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a contact. Choose what happens when a contact with the same email already exists.',
  audience: 'human',
  aiMetadata: {
    description: 'Create a NinjaPipe contact. When the email already exists, the If Contact Exists mode decides: fail, skip, return the existing contact, or update it. The default (fail) is not safe to retry.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.contactWithAction,
  props: {
    ...ninjapipeContacts.contactProps({ emailRequired: true }),
    ifContactExists: Property.StaticDropdown({
      displayName: 'If Contact Exists',
      description: 'What to do when a contact with this email already exists.',
      required: false,
      defaultValue: 'error',
      options: {
        options: [
          { label: 'Fail the step', value: 'error' },
          { label: 'Skip', value: 'skip' },
          { label: 'Return the existing contact', value: 'getExisting' },
          { label: 'Update the existing contact', value: 'updateExisting' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const body = ninjapipeContacts.contactBody(p);
    try {
      const created = await ninjapipeClient.sendRecord({ auth, method: HttpMethod.POST, path: '/contacts', body, operation: 'create contact' });
      return { action: 'created', ...created };
    } catch (error) {
      const mode = p.ifContactExists ?? 'error';
      if (!(error instanceof NinjaPipeApiError) || error.status !== 409 || mode === 'error') throw error;
      const existing = await ninjapipeRecords.findContactByEmail({ auth, email: String(p.email) });
      if (!existing) throw error;
      if (mode === 'skip') return { action: 'skipped', ...existing };
      if (mode === 'getExisting') return { action: 'existing', ...existing };
      const contactPath = `/contacts/${ninjapipeClient.pathId({ value: existing['id'], field: 'Contact ID' })}`;
      const updateBody = await ninjapipeContacts.contactUpdateBody({ auth, contactPath, p, clear: undefined });
      const updated = await ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path: contactPath, body: updateBody, operation: 'update contact' });
      return { action: 'updated', ...updated };
    }
  },
});
