import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { VapiApiError, vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

export const deleteCall = createAction({
  auth: vapiAuth,
  name: 'delete_call',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Call',
  description: 'Permanently delete a call record, including its transcript and recording.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.call,
  props: {
    callId: Property.ShortText({ displayName: 'Call ID', description: 'ID of the call to delete.', required: true }),
  },
  async run(context) {
    const id = vapiUtils.requireId({ value: context.propsValue.callId, fieldName: 'Call ID' });
    let call: unknown;
    try {
      call = await vapiApi.request<unknown>({
        apiKey: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/call/${id}`,
        operation: 'delete call',
      });
    } catch (error) {
      if (
        error instanceof VapiApiError &&
        (error.status === 404 || (error.status === 400 && /not found/i.test(error.message)))
      ) {
        throw new VapiApiError({
          message: `Vapi delete call failed: call ${id} not found. It may already have been deleted.`,
          status: error.status,
          responseBody: error.responseBody,
        });
      }
      throw error;
    }
    return vapiUtils.cleanCall(call);
  },
});
