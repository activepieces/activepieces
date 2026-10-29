import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeContacts } from '../common/contact-props';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateContact = createAction({
  auth: ninjapipeAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates a contact. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'human',
  aiMetadata: {
    description: 'Update a NinjaPipe contact by ID. Only filled fields change; Clear Fields empties fields; custom fields are merged with the existing ones. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contact,
  props: {
    contactId: ninjapipeProps.contactRequired(),
    ...ninjapipeContacts.contactProps({ emailRequired: false }),
    customFields: ninjapipeProps.customFields({ update: true }),
    clearFields: ninjapipeProps.clearFields({ fields: ninjapipeContacts.CONTACT_CLEARABLE }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const contactPath = `/contacts/${ninjapipeClient.pathId({ value: p.contactId, field: 'Contact' })}`;
    const body = await ninjapipeContacts.contactUpdateBody({ auth, contactPath, p, clear: p.clearFields });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path: contactPath, body, operation: 'update contact' });
  },
});
