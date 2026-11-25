import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { deletePartyOutputSchema } from '../../common/output-schemas';

export const aiDeleteParty = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_delete_party',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Contact',
  description: 'Deletes a person or organisation.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a Capsule CRM person or organisation by Party ID. Capsule may also remove the notes, tasks and other records attached to it. Cannot be undone. Result async=true (HTTP 202) means Capsule queued the delete and finishes it shortly; completed=true means it is already gone. A second call for the same ID fails with not found.',
    idempotent: false,
  },
  outputSchema: deletePartyOutputSchema,
  props: {
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of the person or organisation to delete.', required: true }),
  },
  async run({ auth, propsValue }) {
    const partyId = capsuleCrmClient.toId(propsValue.party_id);
    const httpStatus = await capsuleCrmClient.deleteParty({ auth, partyId });
    const queued = httpStatus === 202;
    return { id: partyId, accepted: true, completed: !queued, async: queued, httpStatus };
  },
});
