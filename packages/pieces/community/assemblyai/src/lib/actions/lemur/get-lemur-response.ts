import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { lemurRequestIdProp } from './shared-props';

export const getLemurResponse = createAction({
  name: 'getLemurResponse',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Retrieve LeMUR response',
  description: 'Retrieve a LeMUR response that was previously generated.',
  props: {
    request_id: lemurRequestIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const lemurResponse = await client.lemur.getResponse(
      context.propsValue.request_id
    );
    return lemurResponse;
  },
});
