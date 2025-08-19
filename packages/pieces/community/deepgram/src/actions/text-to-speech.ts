import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL, TEXT_TO_SPEECH_MODELS } from '../common/constants';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const textToSpeechAction = createAction({
  auth: deepgramAuth,
  name: 'text_to_speech',
  displayName: 'Text to Speech',
  description: 'Converts text to audio file.',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Voice',
      required: true,
      options: {
        options: TEXT_TO_SPEECH_MODELS,
      },
    }),
    encoding: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'mp3',
      options: {
        disabled: false,
        options: [
          { label: 'linear16', value: 'linear16' },
          { label: 'flac', value: 'flac' },
          { label: 'mulaw', value: 'mulaw' },
          { label: 'alaw', value: 'alaw' },
          { label: 'mp3', value: 'mp3' },
          { label: 'opus', value: 'opus' },
          { label: 'aac', value: 'aac' },
        ],
      },
    }),
  },
  async run(context) {
    const { text, model, encoding } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + '/speak',
      body: { text },
      headers: {
        Authorization: `Token ${context.auth}`,
        'Content-Type': 'application/json',
      },
      queryParams: {
        model,
        encoding: encoding || 'mp3',
      },
      responseType: 'arraybuffer',
    });

    return {
      file: await context.files.write({
        fileName: `audio.${encoding}`,
        data: Buffer.from(response.body),
      }),
    };
  },
});
