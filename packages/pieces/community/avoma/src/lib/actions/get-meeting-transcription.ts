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
    transcriptionUuid: Property.ShortText({
      displayName: 'Transcription UUID',
      description: 'The UUID of the transcription to retrieve.',
      required: true,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    propsValidation.validateZod(propsValue, { transcriptionUuid: z.string().uuid() });
    return await avomaCommon.getMeetingTranscription({
      apiKey,
      transcriptionUuid: propsValue.transcriptionUuid,
    });
  },
});
