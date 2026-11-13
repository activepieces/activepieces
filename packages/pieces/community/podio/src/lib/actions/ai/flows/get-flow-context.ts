import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetFlowContextOutputSchema } from '../../../output-schemas';

export const getFlowContextAction = createAction({
  auth: podioAuth,
  name: 'podio_get_flow_context',
  outputSchema: podioGetFlowContextOutputSchema,
  displayName: 'Get Flow Context',
  description: 'Gets the attributes available as variables on a flow.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the attributes (type and label, keyed by attribute id) that an existing Podio flow can use as variables in its effects. The flow id comes from List Flows.',
    idempotent: true,
  },
  props: {
    flowId: podioAiProps.id({ required: true, displayName: 'Flow ID', description: 'The id of the flow, from List Flows.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/flow/${propsValue.flowId}/context/` });
  },
});
