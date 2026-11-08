import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const deleteFlowAction = createAction({
  auth: podioAuth,
  name: 'podio_delete_flow',
  displayName: 'Delete Flow',
  description: 'Permanently deletes a flow.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a Podio flow and its effects; it cannot be restored. The flow id comes from List Flows.',
    idempotent: false,
  },
  props: {
    flowId: podioAiProps.id({ required: true, displayName: 'Flow ID', description: 'The id of the flow, from List Flows.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.DELETE, path: `/flow/${propsValue.flowId}` });
  },
});
