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
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a previously generated LeMUR response by its request ID. Use this to read back the result of an earlier LeMUR task without re-running the LLM. Requires a valid LeMUR request ID; read-only and idempotent.',
    idempotent: true,
  },
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
