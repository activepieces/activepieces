import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const deleteContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently deletes a contact from an audience.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes one Tarvent contact (by audience ID and contact ID) including its history; this cannot be undone. To stop emailing someone without deleting them use Subscribe/Unsubscribe Contact or Add Contact To Suppression List. Fails if the contact does not exist, so a second call with the same ID fails.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.deleteContact,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience the contact belongs to.'),
    contactId: tarventCommon.contactId,
  },
  async run(context) {
    return tarventOperations.deleteContact({ auth: context.auth.props, audienceId: context.propsValue.audienceId, contactId: context.propsValue.contactId });
  },
});
