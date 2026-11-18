import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeContacts } from '../common/contact-props';
import { ninjapipeRecords } from '../common/records';
import { ninjapipeSchemas } from '../output-schemas';

export const upsertContact = createAction({
  auth: ninjapipeAuth,
  name: 'upsert_contact',
  classification: 'WRITE',
  displayName: 'Create or Update Contact',
  description: 'Finds a contact by exact email. Updates it when found, creates it when not.',
  audience: 'both',
  aiMetadata: {
    description: 'Create-or-update a NinjaPipe contact keyed on an exact, case-insensitive email match. Use it when an email may already exist (sync, form submissions); safe to retry because a second call updates the same contact. Custom fields are merged. Output action is "created" or "updated".',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contactWithAction,
  props: ninjapipeContacts.contactProps({ emailRequired: true }),
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const existing = await ninjapipeRecords.findContactByEmail({ auth, email: String(p.email) });
    if (existing) {
      const contactPath = `/contacts/${ninjapipeClient.pathId({ value: existing['id'], field: 'Contact ID' })}`;
      const body = await ninjapipeContacts.contactUpdateBody({ auth, contactPath, p, clear: undefined });
      const updated = await ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path: contactPath, body, operation: 'update contact' });
      return { action: 'updated', ...updated };
    }
    const created = await ninjapipeClient.sendRecord({
      auth,
      method: HttpMethod.POST,
      path: '/contacts',
      body: ninjapipeContacts.contactBody(p),
      operation: 'create contact',
    });
    return { action: 'created', ...created };
  },
});
