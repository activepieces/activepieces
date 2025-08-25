import { createAction } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../common/auth';
import { retellAiApi } from '../common/api';
import { retellAiCommon } from '../common/props';

export const getCall = createAction({
  auth: retellAiAuth,
  name: 'get_call',
  displayName: 'Get a Call',
  description: 'Retrieve detailed data of a specific call (e.g., transcript), given a Call ID',
  props: {
    call_id: retellAiCommon.call_id,
  },
  async run(context) {
    const { call_id } = context.propsValue;

    const response = await retellAiApi.get(`/v2/get-call`, context.auth, { call_id });
    return response;
  },
});
