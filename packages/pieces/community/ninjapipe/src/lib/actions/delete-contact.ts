import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const deleteContact = createAction({
  auth: ninjapipeAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently deletes a contact.',
  audience: 'both',
  aiMetadata: {
    description: 'Permanently delete one NinjaPipe contact by ID (contactId; get it from a list or search step). Cannot be undone. A second call fails with 404 because the contact is gone.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.deleted,
  props: {
    contactId: ninjapipeProps.contactRequired(),
  },
  async run(context) {
    const id = ninjapipeClient.pathId({ value: context.propsValue.contactId, field: 'Contact' });
    return ninjapipeClient.deleteRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      path: `/contacts/${id}`,
      id: decodeURIComponent(id),
      operation: 'delete contact',
    });
  },
});
