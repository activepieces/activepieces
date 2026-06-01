import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { BASE_URL } from '../common/constants';
import { deepgramModels } from '../common/models';
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
    model: Property.Dropdown({
      auth: deepgramAuth,
      displayName: 'Voice',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const options = await deepgramModels.fetchTtsModelOptions({
            apiKey: auth.secret_text,
          });
          return { disabled: false, options };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder:
              "Couldn't load models, check your API key or try again.",
          };
        }
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
        Authorization: `Token ${context.auth.secret_text}`,
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
