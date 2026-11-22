import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

async function fetchCall({ apiKey, callId }: { apiKey: string; callId: string }): Promise<Record<string, unknown>> {
  const id = vapiUtils.requireId({ value: callId, fieldName: 'Call ID' });
  const call = await vapiApi.request<unknown>({
    apiKey,
    method: HttpMethod.GET,
    path: `/call/${id}`,
    operation: 'get call',
  });
  return vapiUtils.cleanCall(call);
}

export const getCall = createAction({
  auth: vapiAuth,
  name: 'get_call',
  classification: 'READ',
  displayName: 'Get Call',
  description: 'Retrieve the details of a specific call by its ID.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.call,
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    return fetchCall({ apiKey: context.auth.secret_text, callId: context.propsValue.callId });
  },
});

export const callFetcher = { fetch: fetchCall };
