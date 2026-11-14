import { createAction, Property } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { DatalabOperation } from '../common/client';
import { getResultOperation } from '../operations/get-result';

export const getResultAction = createAction({
  auth: datalabAuth,
  name: 'get_result',
  classification: 'READ',
  displayName: 'Get Result',
  description: 'Fetches the result of an earlier Datalab request that was still running when its step stopped.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the result of an earlier Datalab request by its request_id, for when a Datalab action returned completed=false or failed with "still processing". Needs the same operation that created the request. Polls once and returns completed=false if Datalab is still working, so call it again later; reading a result does not spend Datalab credits, and results are deleted about a day after they finish.',
    idempotent: true,
  },
  props: {
    operation: Property.StaticDropdown<DatalabOperation, true>({
      displayName: 'Operation',
      description: 'The Datalab action that created the request.',
      required: true,
      options: { options: getResultOperation.operationOptions() },
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'The Request ID from that action or its "still processing" error.',
      required: true,
    }),
  },
  outputSchema: getResultOperation.outputSchema,
  async run({ auth, propsValue, files }) {
    return getResultOperation.run({
      apiKey: auth.secret_text,
      operation: propsValue.operation,
      requestId: propsValue.request_id,
      files,
    });
  },
});
