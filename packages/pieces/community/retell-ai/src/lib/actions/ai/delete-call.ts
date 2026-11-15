import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, isRetellStatus, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellSchemas } from '../../common/schemas';
export const deleteCallAction = createAction({
  auth: retellAiAuth,
  name: 'delete_call',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Call',
  description: 'Deletes a call and its transcript and recording.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one call record with its transcript, recording and analysis. Cannot be undone. A call that is already gone returns already_deleted=true.',
    idempotent: false,
  },
  props: {
    call_id: retellAiProps.id({ displayName: 'Call ID', description: 'The call to delete.' }),
  },
  outputSchema: retellSchemas.deleted({ idKey: 'call_id', idLabel: 'Call ID' }),
  async run({ auth, propsValue }) {
    const callId = retellInput.seg({ value: propsValue.call_id, label: 'Call ID' });
    try {
      await retellApiCall({ apiKey: apiKeyOf(auth), method: HttpMethod.DELETE, path: `/v2/delete-call/${callId}` });
    } catch (error) {
      if (isRetellStatus({ error, statuses: [404] })) {
        return { call_id: decodeURIComponent(callId), deleted: false, already_deleted: true };
      }
      throw error;
    }
    return { call_id: decodeURIComponent(callId), deleted: true, already_deleted: false };
  },
});
