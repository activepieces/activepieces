import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { apiKeyOf, retellApiCall } from '../common/client';
import { retellInput } from '../common/input';
import { callIdDropdown } from '../common/props';
import { retellSchemas } from '../common/schemas';

export const getCall = createAction({
  auth: retellAiAuth,
  name: 'get_call',
  classification: 'READ',
  displayName: 'Get Call',
  description: 'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID.',
  audience: 'human',
  aiMetadata: {
    description: 'Returns one Retell call with status, transcript, recording and analysis. Read-only.',
    idempotent: true,
  },
  props: {
    callId: callIdDropdown,
  },
  outputSchema: retellSchemas.rawCall,
  async run({ propsValue, auth }) {
    return retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.GET,
      path: `/v2/get-call/${retellInput.seg({ value: propsValue.callId, label: 'Call ID' })}`,
      retryRateLimit: true,
    });
  },
});
