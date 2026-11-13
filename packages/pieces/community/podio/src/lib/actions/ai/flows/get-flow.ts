import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateFlowOutputSchema } from '../../../output-schemas';

export const getFlowAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flow',
  outputSchema: podioCreateFlowOutputSchema,
  displayName: 'Get Flow',
  description: 'Gets one flow with its cause and effects.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio flow: its name, type, cause config and effects with their effect ids, as needed by Update Flow. The flow id comes from List Flows.',
    idempotent: true,
  },
  props: {
    flowId: podioAiProps.id({ required: true, displayName: 'Flow ID', description: 'The id of the flow, from List Flows.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/flow/${propsValue.flowId}` });
  },
});
