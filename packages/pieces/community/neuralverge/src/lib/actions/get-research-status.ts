import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getResearchStatusAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_research_status',
  classification: 'READ',
  displayName: 'Get Research Status',
  description: 'Get the status and result of an AI research task by session ID. Cost: free (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Check the status of an AI research task started earlier and fetch its result when complete. Free and safe to retry; use when research was started without waiting.',
    idempotent: true,
  },
  props: {
    session_id: Property.ShortText({
      displayName: 'Session ID',
      description: 'Session ID returned by Run AI Research, for example 11111111-1111-1111-1111-111111111111.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.getSessionStatus({
      apiKey: auth.secret_text,
      sessionId: propsValue.session_id,
    });
  },
});
