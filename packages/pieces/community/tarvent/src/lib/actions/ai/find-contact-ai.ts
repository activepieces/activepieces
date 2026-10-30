import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const findContactAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_find_contact_ai',
  classification: 'READ',
  displayName: 'Find Contact (AI)',
  description: 'Finds one contact by email or contact ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Looks up one Tarvent contact in an audience by email or by contact ID (give exactly one). Returns found=false and contact=null when nothing matches. With a custom identifier the email lookup returns the first match. To list many contacts use List Contacts. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.findContact,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    email: Property.ShortText({ displayName: 'Email', description: 'Find by email. Leave empty when using Contact ID.', required: false }),
    contactId: Property.ShortText({ displayName: 'Contact ID', description: 'Find by contact ID. Leave empty when using email.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.findContact({ auth: context.auth.props, audienceId: p.audienceId, email: p.email, contactId: p.contactId });
  },
});
