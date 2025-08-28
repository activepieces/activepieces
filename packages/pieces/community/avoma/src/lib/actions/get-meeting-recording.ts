import { propsValidation } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import z from 'zod';
import { avomaAuth, avomaCommon } from '../common';

export const getMeetingRecording = createAction({
  auth: avomaAuth,
  name: 'getMeetingRecording',
  displayName: 'Get Meeting Recording',
  description: 'Returns a Video and Audio recording for a given meeting.',
  props: {
    meetingUuid: Property.ShortText({
      displayName: 'Meeting UUID',
      description: 'The UUID of the meeting to retrieve the recording for.',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    propsValidation.validateZod(propsValue, { meetingUuid: z.string().uuid() });
    return await avomaCommon.getMeetingRecording({
      apiKey,
      meetingUuid: propsValue.meetingUuid,
    });
  },
});
