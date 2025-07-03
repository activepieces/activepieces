import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { lemurRequestIdProp } from './shared-props';

export const purgeLemurRequestData = createAction({
  name: 'purgeLemurRequestData',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Purge LeMUR request data',
  description: `Delete the data for a previously submitted LeMUR request.
The LLM response data, as well as any context provided in the original request will be removed.`,
  props: {
    request_id: lemurRequestIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const purgeRequestDataResponse = await client.lemur.purgeRequestData(
      context.propsValue.request_id
    );
    return purgeRequestDataResponse;
  },
});
