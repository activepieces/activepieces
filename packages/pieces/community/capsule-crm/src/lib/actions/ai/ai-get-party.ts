import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { partyEmbedOutputSchema } from '../../common/output-schemas';

export const aiGetParty = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_get_party',
  classification: 'READ',
  displayName: 'Get Contact',
  description: 'Gets one person or organisation by ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Reads one Capsule CRM party (person or organisation) by its numeric ID, including emails, phone numbers, addresses, websites, organisation, owner and tags. Read-only.',
    idempotent: true,
  },
  outputSchema: partyEmbedOutputSchema,
  props: {
    party_id: Property.ShortText({ displayName: 'Party ID', description: 'Numeric ID of the person or organisation.', required: true }),
  },
  async run({ auth, propsValue }) {
    return capsuleCrmClient.getParty({ auth, partyId: capsuleCrmClient.segment(propsValue.party_id), embed: 'tags,fields' });
  },
});
