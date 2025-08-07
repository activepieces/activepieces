import { createAction, Property } from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { OpenPhoneAPI } from '../common/common';

export const getCallSummaryAction = createAction({
  auth: openphoneAuth,
  name: 'get_call_summary',
  displayName: 'Get Call Summary',
  description: 'Get summary of a call by ID',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'ID of the call to get summary for',
      required: true,
    }),
  },
  async run(context) {
    const { callId } = context.propsValue;
    const api = new OpenPhoneAPI(context.auth);

    const result = await api.makeRequest<any>('GET', `/calls/${callId}/summary`);
    
    return {
      success: true,
      callId,
      summary: result
    };
  },
});