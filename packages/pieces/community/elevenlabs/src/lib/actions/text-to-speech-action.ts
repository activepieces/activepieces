import { Property, createAction } from '@activepieces/pieces-framework';
import { createClient, ExtendedReadableStream } from '../common';
import { elevenlabsAuth } from '../auth';
import { elevenlabsTextToSpeechOutputSchema } from '../output-schemas';

export const textToSpeech = createAction({
  description: 'Turn text into spoken audio with an ElevenLabs voice.',
  audience: 'both',
  aiMetadata: { description: 'Synthesizes spoken audio from a text string using a chosen ElevenLabs voice, returning an MP3 file. Use to turn written content into a narrated voiceover or speech clip. Requires a voice (selected from the account\'s available voices) and the text; the model is optional and defaults to ElevenLabs\' default. Not idempotent — each call generates a new audio file.', idempotent: false },
  displayName: 'Text to Speech',
  name: 'elevenlabs-text-to-speech',
  outputSchema: elevenlabsTextToSpeechOutputSchema,
  classification: 'READ',
  auth: elevenlabsAuth,
  props: {
    voice: Property.Dropdown({
      auth: elevenlabsAuth,
      displayName: 'Voice',
      required: true,
      description: 'The voice that reads the text aloud.',
      refreshers: [],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const apiAuth = auth

        if (!apiAuth) {
          return {
            disabled: true,
            placeholder: 'Connect your ElevenLabs account first',
            options: [],
          };
        }

        try {
          const elevenlabs = createClient(apiAuth);
          const response = await elevenlabs.voices.getAll()

          if (response.voices.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No voices found in your account.',
            };
          }

          return {
            disabled: false,
            placeholder: 'Select a voice',
            options: response.voices.map((template) => {
              return {
                label: template.category ? `${template.name} (${template.category})` : `${template.name}`,
                value: template.voiceId,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load voices. Check your connection.",
          };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      required: true,
      description: 'What the voice will say. The step returns an MP3 file.',
      placeholder: 'Hello! Thanks for calling. How can I help you today?',
    }),
    model: Property.Dropdown({
      auth: elevenlabsAuth,
      displayName: 'Model',
      required: false,
      description: "Leave empty to use ElevenLabs' default model.",
      refreshers: [],
      refreshOnSearch: false,
      options: async ({ auth }) => {
        const apiAuth = auth

        if (!apiAuth) {
          return {
            disabled: true,
            placeholder: 'Connect your ElevenLabs account first',
            options: [],
          };
        }

        try {
          const elevenlabs = createClient(apiAuth);
          const models = await elevenlabs.models.list()

          if (models.length === 0) {
            return {
              disabled: false,
              options: [],
              placeholder: 'No models found.',
            };
          }

          return {
            disabled: false,
            placeholder: 'Default model',
            options: models.map((template) => {
              return {
                label: `${template.name} (${template.modelId})`,
                value: template.modelId,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models. Check your connection.",
          };
        }
      },
    }),
  },
  async run({ auth, propsValue, files }) {
    const elevenlabs = createClient(auth);

    const audioStream = await elevenlabs.textToSpeech.stream(
      propsValue.voice,
      {
        modelId: propsValue.model || undefined,
        text: propsValue.text,
      }
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
