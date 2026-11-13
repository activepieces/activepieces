import { createAction, Property } from '@activepieces/pieces-framework';
import { datalabAuth } from '../auth';
import { DatalabOperation } from '../common/client';
import { getResultOperation } from '../operations/get-result';

export const getResultAction = createAction({
  auth: datalabAuth,
  name: 'get_result',
  classification: 'READ',
  displayName: 'Get Result',
  description:
    'Fetches the result of an earlier Datalab request by its Request ID, for example when a step ran out of time while Datalab was still working. Checks once and does not wait: if Datalab is still working, Completed is false, so run Get Result again later. Results are kept for about one day.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetch the result of an earlier Datalab request by its request_id, for when a Datalab action returned completed=false or failed with "still processing". Needs the same operation that created the request. Polls once and returns completed=false if Datalab is still working, so call it again later; reading a result does not spend Datalab credits, and results are deleted about a day after they finish.',
    idempotent: true,
  },
  props: {
    operation: Property.StaticDropdown<DatalabOperation, true>({
      displayName: 'Operation',
      description: 'Pick the action that created the request. The result is read from that action, so it must match.',
      required: true,
      options: { options: getResultOperation.operationOptions() },
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'The Request ID returned by that action, or named in its "still processing" error. Results are kept for about one day.',
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
