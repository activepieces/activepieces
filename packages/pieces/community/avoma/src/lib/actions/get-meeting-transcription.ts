import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import z from 'zod';
import { avomaAuth, avomaCommon } from '../common';

export const getMeetingTranscription = createAction({
  auth: avomaAuth,
  name: 'getMeetingTranscription',
  displayName: 'Get Meeting Transcription',
  description: 'Returns a single transcription for a given meeting.',
  props: {
    meetingUuid: Property.ShortText({
      displayName: 'Meeting UUID',
      description: 'The UUID of the meeting to retrieve the recording for.',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    propsValidation.validateZod(propsValue, { meetingUuid: z.string().uuid() });
    return await avomaCommon.getMeetingTranscription({
      apiKey,
      meetingUuid: propsValue.meetingUuid,
    });
  },
});
