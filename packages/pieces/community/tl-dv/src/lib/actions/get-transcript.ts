import { createAction } from '@activepieces/pieces-framework';
import { tldvAuth } from '../../index';
import { HttpMethod } from '@activepieces/pieces-common';
import { tldvCommon } from '../common/client';
import { meetingIdProperty } from '../common/props';

export const getTranscript = createAction({
  auth: tldvAuth,
  name: 'get_transcript',
  displayName: 'Get Transcript',
  description: 'Get meeting transcript by meeting ID',
  props: {
    meetingId: meetingIdProperty,
  },
  async run(context) {
    const { meetingId } = context.propsValue;

    const response = await tldvCommon.apiCall<{
      id: string;
      meetingId: string;
      data: Array<{
        speaker: string;
        text: string;
        startTime: number;
        endTime: number;
      }>;
    }>({
      method: HttpMethod.GET,
      url: `/v1alpha1/meetings/${meetingId}/transcript`,
      auth: { apiKey: context.auth.secret_text },
    });

    return response;
  },
});

