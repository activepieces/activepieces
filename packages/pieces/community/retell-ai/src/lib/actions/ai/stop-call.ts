import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall, toRetellError } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const stopCallAction = createAction({
  auth: retellAiAuth,
  name: 'stop_call',
  classification: 'DESTRUCTIVE',
  displayName: 'Stop Call',
  description: 'Hangs up an ongoing call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Hangs up one ongoing Retell call immediately; the conversation cannot be resumed. If the call is unknown or already over, returns stopped=false with the reason instead of failing.',
    idempotent: false,
  },
  props: {
    call_id: retellAiProps.id({ displayName: 'Call ID', description: 'The ongoing call to stop.' }),
  },
  outputSchema: retellSchemas.callStopped,
  async run({ auth, propsValue }) {
    const callId = retellInput.seg({ value: propsValue.call_id, label: 'Call ID' });
    try {
      await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.POST, path: `/v2/stop-call/${callId}` });
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { call_id: decodeURIComponent(callId), stopped: false, reason: 'Call not found or no longer ongoing (HTTP 404).' };
      }
      const mapped = toRetellError(error);
      if (mapped !== undefined && mapped.status === 400 && /only stop an ongoing call/i.test(mapped.message)) {
        return { call_id: decodeURIComponent(callId), stopped: false, reason: 'Call is not ongoing (not started yet or already over).' };
      }
      throw error;
    }
    return { call_id: decodeURIComponent(callId), stopped: true, reason: null };
  },
});
