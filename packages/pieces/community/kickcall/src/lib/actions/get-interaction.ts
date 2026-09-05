import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallClient } from '../common/client';
import { agentIdDropdown, locationIdDropdown } from '../common/props';

export const getInteractionAction = createAction({
  auth: kickcallAuth,
  name: 'get_interaction',
  displayName: 'Get Call Details',
  description:
    'Returns call details for a Kickcall interaction, including transcript and related metadata.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches full call details for a Kickcall interaction by interaction id, agent, and location. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    interaction_id: Property.ShortText({
      displayName: 'Interaction ID',
      description:
        'Interaction id from Create Phone Call output (for example 50428). Paste the id returned when the call was queued.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return kickcallClient.marketplaceRequest({
      auth,
      path: '/api/v1/marketplace/interactions',
      body: {
        location_id: propsValue.location_id,
        agent_id: propsValue.agent_id,
        interaction_id: propsValue.interaction_id,
      },
    });
  },
});
