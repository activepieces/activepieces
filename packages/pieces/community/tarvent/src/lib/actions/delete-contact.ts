import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventClient } from '../common/client';
import { tarventOutputSchemas } from '../output-schemas';

export const deleteContact = createAction({
  auth: tarventAuth,
  name: 'tarvent_delete_contact',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Permanently deletes a contact from an audience.',
  audience: 'both',
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
    const audienceId = tarventCommon.requireText({ value: context.propsValue.audienceId, label: 'Audience' });
    const id = tarventCommon.requireText({ value: context.propsValue.contactId, label: 'Contact ID' });
    await tarventClient.booleanMutation({
      auth: context.auth.props,
      operation: 'DeleteContact',
      field: 'deleteContact',
      argDefs: '$input: DeleteContactInput!',
      args: 'input: $input',
      variables: { input: { audienceId, id } },
    });
    return { success: true, contactId: id, audienceId };
  },
});
