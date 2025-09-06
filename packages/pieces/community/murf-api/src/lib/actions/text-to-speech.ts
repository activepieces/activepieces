import { ApFile, createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { AUDIO_FORMATS, SAMPLE_RATES, CHANNEL_TYPES, API_ENDPOINTS, COMMON_LANGUAGES } from '../common/common';

export const textToSpeechAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'text-to-speech',
  displayName: 'Text to Speech',
  description: 'Convert text to speech using Murf AI',
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text to convert to speech',
      required: true,
    }),
    voiceId: Property.Dropdown({
      displayName: 'Voice',
      description: 'Voice to use for speech generation',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await murfCommon.apiCallWithToken({
            apiKey: auth as string,
            method: 'GET' as any,
            resourceUri: API_ENDPOINTS.LIST_VOICES,
          });

          const voices = response.body.voices || response.body || [];
          
          return {
            disabled: false,
            options: voices.map((voice: any) => {
              const name = voice.displayName || voice.name || voice.voiceId || voice.id;
              const gender = voice.gender ? ` (${voice.gender})` : '';
              const locale = voice.locale ? ` - ${voice.locale}` : '';
              return {
                label: `${name}${gender}${locale}`,
                value: voice.voiceId || voice.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load voices',
          };
        }
      },
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Audio format',
      required: false,
      defaultValue: 'WAV',
      options: {
        options: AUDIO_FORMATS,
      },
    }),
    sampleRate: Property.StaticDropdown({
      displayName: 'Sample Rate',
      description: 'Audio sample rate',
      required: false,
      defaultValue: 44100,
      options: {
        options: SAMPLE_RATES,
      },
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Audio channel type',
      required: false,
      defaultValue: 'MONO',
      options: {
        options: CHANNEL_TYPES,
      },
    }),
    style: Property.Dropdown({
      displayName: 'Style',
      description: 'Voice style (optional)',
      required: false,
      refreshers: ['voiceId'],
      options: async ({ auth, voiceId }) => {
        if (!auth || !voiceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a voice first',
          };
        }

        try {
          const response = await murfCommon.apiCallWithToken({
            apiKey: auth as string,
            method: 'GET' as any,
            resourceUri: API_ENDPOINTS.LIST_VOICES,
          });

          const voices = response.body.voices || response.body || [];
          const selectedVoice = voices.find((voice: any) => 
            (voice.voiceId || voice.id) === voiceId
          );

          if (!selectedVoice || !selectedVoice.availableStyles) {
            return {
              disabled: false,
              options: [
                { label: 'Default', value: '' },
              ],
            };
          }

          const styles = Array.isArray(selectedVoice.availableStyles) 
            ? selectedVoice.availableStyles 
            : Object.keys(selectedVoice.availableStyles);

          return {
            disabled: false,
            options: [
              { label: 'Default', value: '' },
              ...styles.map((style: string) => ({
                label: style.charAt(0).toUpperCase() + style.slice(1),
                value: style,
              })),
            ],
          };
        } catch (error) {
          return {
            disabled: false,
            options: [
              { label: 'Default', value: '' },
            ],
          };
        }
      },
    }),
    pitch: Property.Number({
      displayName: 'Pitch',
      description: 'Pitch adjustment (-50 to 50). Negative values make voice deeper, positive values make it higher.',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      description: 'Speech rate (-50 to 50). Negative values make speech slower, positive values make it faster.',
      required: false,
    }),
    audioDuration: Property.Number({
      displayName: 'Audio Duration',
      description: 'Expected audio duration in seconds',
      required: false,
    }),
    variation: Property.Number({
      displayName: 'Variation',
      description: 'Voice variation (0 to 5). Higher values add more natural variation to the speech.',
      required: false,
    }),
    multiNativeLocale: Property.StaticDropdown({
      displayName: 'Multi Native Locale',
      description: 'Multi native locale',
      required: false,
      options: {
        options: [
          { label: 'None', value: '' },
          ...COMMON_LANGUAGES,
        ],
      },
    }),
    encodeAsBase64: Property.Checkbox({
      displayName: 'Encode as Base64',
      description: 'Return audio as base64 encoded data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    try {
      if (!context.propsValue.text || context.propsValue.text.trim().length === 0) {
        throw new Error('Text cannot be empty. Please provide text to convert to speech.');
      }

      if (context.propsValue.text.length > 5000) {
        throw new Error('Text is too long. Please keep it under 5000 characters.');
      }

      const requestBody: any = {
        text: context.propsValue.text.trim(),
        voiceId: context.propsValue.voiceId,
      };

      if (context.propsValue.format) {
        requestBody.format = context.propsValue.format;
      }
      if (context.propsValue.sampleRate) {
        requestBody.sampleRate = context.propsValue.sampleRate;
      }
      if (context.propsValue.channelType) {
        requestBody.channelType = context.propsValue.channelType;
      }
      if (context.propsValue.style) {
        requestBody.style = context.propsValue.style;
      }
      if (context.propsValue.pitch !== undefined) {
        if (context.propsValue.pitch < -50 || context.propsValue.pitch > 50) {
          throw new Error('Pitch must be between -50 and 50.');
        }
        requestBody.pitch = context.propsValue.pitch;
      }
      if (context.propsValue.rate !== undefined) {
        if (context.propsValue.rate < -50 || context.propsValue.rate > 50) {
          throw new Error('Rate must be between -50 and 50.');
        }
        requestBody.rate = context.propsValue.rate;
      }
      if (context.propsValue.audioDuration !== undefined) {
        requestBody.audioDuration = context.propsValue.audioDuration;
      }
      if (context.propsValue.variation !== undefined) {
        if (context.propsValue.variation < 0 || context.propsValue.variation > 5) {
          throw new Error('Variation must be between 0 and 5.');
        }
        requestBody.variation = context.propsValue.variation;
      }
      if (context.propsValue.multiNativeLocale) {
        requestBody.multiNativeLocale = context.propsValue.multiNativeLocale;
      }
      if (context.propsValue.encodeAsBase64) {
        requestBody.encodeAsBase64 = context.propsValue.encodeAsBase64;
      }

      const response = await murfCommon.apiCallWithToken({
        apiKey: context.auth,
        method: 'POST' as any,
        resourceUri: API_ENDPOINTS.TEXT_TO_SPEECH,
        body: requestBody,
      });

      const result: any = {
        audioLengthInSeconds: response.body.audioLengthInSeconds,
        consumedCharacterCount: response.body.consumedCharacterCount,
        remainingCharacterCount: response.body.remainingCharacterCount,
      };

      if (response.body.audioFile) {
        result.audioFile = response.body.audioFile;
      }

      if (response.body.warning) {
        result.warning = response.body.warning;
      }

      if (response.body.audioBase64 && context.propsValue.encodeAsBase64) {
        const fileExtension = context.propsValue.format?.toLowerCase() || 'wav';
        const fileName = `tts.${fileExtension}`;
        
        const file: ApFile = {
          filename: fileName,
          data: response.body.audioBase64,
          base64: response.body.audioBase64,
        };

        result.audioFile = file;
      }

      return result;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Murf API key in your account settings.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again, or upgrade your Murf plan for higher limits.');
      }
      if (error.response?.status === 400) {
        const errorMsg = error.response?.body?.message || error.response?.body?.error || 'Invalid request';
        throw new Error(`Invalid request: ${errorMsg}. Please check your input parameters and try again.`);
      }
      if (error.response?.status === 422) {
        throw new Error('Validation error. Please check that your text is not empty and voice ID is valid.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }

      throw new Error(`Text to speech failed: ${error.message || 'Unknown error'}. Please try again or contact support if the issue persists.`);
    }
  },
});
