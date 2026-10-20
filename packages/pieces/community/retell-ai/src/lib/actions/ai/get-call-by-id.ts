import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const getCallByIdAction = createAction({
  auth: retellAiAuth,
  name: 'get_call_by_id',
  classification: 'READ',
  displayName: 'Get Call by ID',
  description: 'Returns one call with transcript, recording and analysis.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one call's status, transcript, recording link, post-call analysis and cost. Transcript appears after the call ends and analysis after it is analyzed. Use List Calls to find call IDs. Read-only.",
    idempotent: true,
  },
  props: {
    call_id: retellAiProps.id({ displayName: 'Call ID', description: 'The call ID returned when the call was created or listed.' }),
  },
  outputSchema: retellSchemas.call,
  async run({ auth, propsValue }) {
    const call = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/v2/get-call/${retellInput.seg({ value: propsValue.call_id, label: 'Call ID' })}`,
      retryRateLimit: true,
    });
    return retellMap.call(call);
  },
});
