import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeOutputSchemas } from '../../common/output-schemas';

const deleteContact = createAction({
  auth: closeAuth,
  name: 'delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently delete a contact person from its lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes one Close contact by contact id (cont_...). The lead and its other contacts stay. This cannot be undone. Repeating it on an already-deleted contact returns not found.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.deleted,
  props: {
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'cont_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const contactId = closeClient.closeId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' });
    await closeClient.request({ auth, method: HttpMethod.DELETE, path: `/contact/${closeClient.pathId(contactId)}/` });
    return { deleted: true, id: contactId };
  },
});

export { deleteContact };
