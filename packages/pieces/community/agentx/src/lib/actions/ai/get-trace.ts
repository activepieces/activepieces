import { createAction, Property } from '@activepieces/pieces-framework';

import { agentxAuth } from '../../auth';
import { agentxApi } from '../../common/api';

export const getTraceAction = createAction({
  auth: agentxAuth,
  name: 'agentx_get_trace',
  displayName: 'Get Trace',
  description: 'Gets the detailed prompt trace of an AgentX reply.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets the detailed prompt trace behind one AgentX reply, by trace ID (the `trace` field from Send Message, or from Get Message Trace). Use it to see how the agent produced an answer.',
    idempotent: true,
  },
  props: {
    traceId: Property.ShortText({
      displayName: 'Trace ID',
      description: 'AgentX trace ID, from Send Message or Get Message Trace.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await agentxApi.getTrace({ auth, traceId: propsValue.traceId });
  },
});
