import { ApFile, createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import { murfCommon } from '../common/client';
import { AUDIO_FORMATS, SAMPLE_RATES, CHANNEL_TYPES, API_ENDPOINTS } from '../common/common';

export const voiceChangeAction = createAction({
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    required: true,
  }),
  name: 'voice-change',
  displayName: 'Voice Change',
  description: 'Change voice of audio using Murf AI',
  props: {
    voiceId: Property.Dropdown({
      displayName: 'Voice',
      description: 'Voice to change to',
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
    file: Property.File({
      displayName: 'File',
      description: 'Audio file to process',
      required: false,
    }),
    fileUrl: Property.ShortText({
      displayName: 'File URL',
      description: 'URL of audio file to process',
      required: false,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: 'Output audio format',
      required: false,
      defaultValue: 'WAV',
      options: {
        options: AUDIO_FORMATS,
      },
    }),
    sampleRate: Property.StaticDropdown({
      displayName: 'Sample Rate',
      description: 'Output audio sample rate',
      required: false,
      defaultValue: 44100,
      options: {
        options: SAMPLE_RATES,
      },
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Output audio channel type',
      required: false,
      defaultValue: 'MONO',
      options: {
        options: CHANNEL_TYPES,
      },
    }),
    pitch: Property.Number({
      displayName: 'Pitch',
      description: 'Pitch adjustment (-50 to 50)',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Rate',
      description: 'Speech rate (-50 to 50)',
      required: false,
    }),
    encodeOutputAsBase64: Property.Checkbox({
      displayName: 'Encode Output as Base64',
      description: 'Return audio as base64 encoded data',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    try {
      if (!context.propsValue.file && !context.propsValue.fileUrl) {
        throw new Error('Either file or file URL must be provided');
      }

      if (context.propsValue.file && context.propsValue.fileUrl) {
        throw new Error('Cannot provide both file and file URL');
      }

      const requestBody: any = {
        voiceId: context.propsValue.voiceId,
      };

      if (context.propsValue.file) {
        requestBody.file = context.propsValue.file.data;
      } else if (context.propsValue.fileUrl) {
        requestBody.file_url = context.propsValue.fileUrl;
      }

      if (context.propsValue.format) {
        requestBody.format = context.propsValue.format;
      }
      if (context.propsValue.sampleRate) {
        requestBody.sampleRate = context.propsValue.sampleRate;
      }
      if (context.propsValue.channelType) {
        requestBody.channelType = context.propsValue.channelType;
      }
      if (context.propsValue.pitch !== undefined) {
        requestBody.pitch = context.propsValue.pitch;
      }
      if (context.propsValue.rate !== undefined) {
        requestBody.rate = context.propsValue.rate;
      }
      if (context.propsValue.encodeOutputAsBase64) {
        requestBody.encode_output_as_base64 = context.propsValue.encodeOutputAsBase64;
      }

      const response = await murfCommon.apiCallWithToken({
        apiKey: context.auth,
        method: 'POST' as any,
        resourceUri: API_ENDPOINTS.VOICE_CHANGE,
        body: requestBody,
      });

      const result: any = {
        audio_file: response.body.audio_file,
        audio_length_in_seconds: response.body.audio_length_in_seconds,
      };

      if (response.body.remaining_character_count) {
        result.remaining_character_count = response.body.remaining_character_count;
      }

      if (response.body.audio_base64 && context.propsValue.encodeOutputAsBase64) {
        const fileExtension = context.propsValue.format?.toLowerCase() || 'wav';
        const fileName = `voice_change.${fileExtension}`;
        
        const file: ApFile = {
          filename: fileName,
          data: response.body.audio_base64,
          base64: response.body.audio_base64,
        };

        result.audio_file = file;
      }

      return result;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Murf API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Voice change failed: ${error.message || 'Unknown error'}`);
    }
  },
});
