import { createAction, Property } from '@activepieces/pieces-framework';
import { openphoneAuth } from '../common/auth';
import { OpenPhoneAPI } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCallTranscriptionAction = createAction({
  auth: openphoneAuth,
  name: 'get_call_transcription',
  displayName: 'Get Call Transcription',
  description: 'Get transcription for a call',
  props: {
    callId: Property.ShortText({
      displayName: 'Call ID',
      description: 'ID of the call to get transcription for',
      required: true,
    }),
  },
  async run(context) {
    const { callId } = context.propsValue;
    const api = new OpenPhoneAPI(context.auth);

    const result = await api.makeRequest<any>(HttpMethod.GET, `https://api.openphone.com/v1/call-transcripts/{id}`, { id: callId });
    
    return {
      success: true,
      callId,
      transcription: result
    };
  },
});
