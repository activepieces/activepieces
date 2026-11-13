import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListFlowsOutputSchema } from '../../../output-schemas';

export const listFlowsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_flows',
  outputSchema: podioListFlowsOutputSchema,
  displayName: 'List Flows',
  description: 'Lists the flows on an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists every Podio flow on an app, with the flow ids that Get Flow, Update Flow and Delete Flow take. The app id comes from List Apps or Get App.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app, from List Apps or Get App.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/flow/app/${propsValue.appId}/` });
    return { flows: body, count: body.length };
  },
});
