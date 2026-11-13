import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const deleteContactAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_delete_contact_ai',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact (AI)',
  description: 'Permanently deletes a contact from an audience.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one Tarvent contact (audience ID + contact ID) with its history; this cannot be undone, so only do it when the user asked to delete. To stop emailing someone use Subscribe/Unsubscribe Contact instead. Fails if the contact does not exist.',
    idempotent: false,
  },
  outputSchema: tarventOutputSchemas.deleteContact,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'The Tarvent contact ID (from Find Contact or List Contacts).', required: true }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.deleteContact({ auth: context.auth.props, audienceId: p.audienceId, contactId: p.contactId });
  },
});
