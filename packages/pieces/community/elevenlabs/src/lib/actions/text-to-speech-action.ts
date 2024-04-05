/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { ElevenLabsClient } from 'elevenlabs';

export const textToSpeech = createAction({
  description: 'Convert text to speech using Elevenlabs',
  displayName: 'Text to Speech',
  name: 'elevenlabs-text-to-speech',
  props: {
    voice: Property.Dropdown({
      displayName: 'Voice',
      required: true,
      description: 'Select the voice for the text to speech',
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
          const request = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `https://api.elevenlabs.io/v1/voices`,
            headers: {
              'xi-api-key': `${auth}`,
            },
          });
          return {
            disabled: false,
            options: request.body['voices'].map((template: any) => {
              return {
                label: template.name,
                value: template.voice_id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load voices, check your API key.",
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'The text to convert to speech',
    }),
  },
  async run({ auth, propsValue, files }) {
    const elevenlabs = new ElevenLabsClient({
      apiKey: `${auth}`,
    });

    const audio = await elevenlabs.generate({
      voice: propsValue.voice,
      text: propsValue.text,
    });

    const chunks: any[] = [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }

    return files.write({
      fileName: 'audio.mp3',
      data: Buffer.concat(chunks),
    });
  },
});
