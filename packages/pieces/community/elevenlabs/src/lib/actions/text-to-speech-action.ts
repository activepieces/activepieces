import { Property, createAction } from '@activepieces/pieces-framework';
import { ElevenAuthType, createClient, ExtendedReadableStream } from '../common';

export const textToSpeech = createAction({
  description: 'Convert text to speech using Elevenlabs',
  displayName: 'Text to Speech',
  name: 'elevenlabs-text-to-speech',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: false,
      refreshers: [],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const apiAuth = auth as ElevenAuthType

        if (!apiAuth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }

        try {
          const elevenlabs = createClient(apiAuth);
          const models = await elevenlabs.models.list()

          return {
            disabled: false,
            placeholder: 'Default model',
            options: models.map((template) => {
              return {
                // there are models with the same name
                label: `${template.name} (${template.modelId})`,
                value: template.modelId,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, check your API key.",
          };
        }
      },
    }),
    voice: Property.Dropdown({
      displayName: 'Voice',
      required: true,
      description: 'Select the voice for the text to speech',
      refreshers: [],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const apiAuth = auth as ElevenAuthType

        if (!apiAuth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }

        try {
          const elevenlabs = createClient(apiAuth);
          const response = await elevenlabs.voices.getAll()

          return {
            disabled: false,
            options: response.voices.map((template) => {
              return {
                label: `${template.name}`,
                value: template.voiceId,
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
    const elevenlabs = createClient(auth as ElevenAuthType);

    const audioStream = await elevenlabs.textToSpeech.stream(
      propsValue.voice,
      {
        modelId: propsValue.model || undefined,
        text: propsValue.text,
      }
      // node implementation of ReadableStream<Uint8Array> has asyncInterator
    ) as ExtendedReadableStream<Buffer>;

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream) {
      chunks.push(chunk);
    }

    return files.write({
      fileName: 'audio.mp3',
      data: Buffer.concat(chunks),
    });
  },
});
