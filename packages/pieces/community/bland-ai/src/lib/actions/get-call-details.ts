import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const getCallDetails = createAction({
  auth: blandAiAuth,
  name: 'get_call_details',
  displayName: 'Get Call Details',
  description:
    'Retrieve detailed information, metadata, and transcripts for a call.',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'The unique identifier of the call.',
      required: true,
    }),
  },
  async run(context) {
    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/calls/${encodeURIComponent(context.propsValue.callId)}`,
    });
  },
});
