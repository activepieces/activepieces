import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { murfApiCall } from '../common';
import { murfAuth } from '../..';

type Voice = {
  voiceId: string;
  displayName: string | null;
  gender: string | null;
  locale: string | null;
  supportedLocales: Record<string, { availableStyles: string[]; detail: string }> | null;
};

export const textToSpeech = createAction({
  name: 'text_to_speech',
  auth: murfAuth,
  displayName: 'Text to Speech',
  description: 'Generate speech audio from text',
  props: {
    voiceId: Property.Dropdown({
      displayName: 'Voice',
      description: 'Select a voice for speech synthesis',
      auth: murfAuth,
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const voices = await murfApiCall<Voice[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          endpoint: '/speech/voices',
        });

        return {
          disabled: false,
          options: voices.map((voice) => ({
            label: voice.displayName ?? voice.voiceId,
            value: voice.voiceId,
          })),
        };
      },
    }),
    multiNativeLocale: Property.Dropdown({
      displayName: 'Language',
      description: 'Language for the generated audio',
      required: false,
      refreshers: ['voiceId'],
      auth: murfAuth,
      options: async ({ auth, voiceId }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        if (!voiceId) {
          return {
            disabled: true,
            placeholder: 'Select a voice first',
            options: [],
          };
        }
        const voices = await murfApiCall<Voice[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          endpoint: '/speech/voices',
        });

        const selectedVoice = voices.find((v) => v.voiceId === voiceId);
        if (!selectedVoice?.supportedLocales) {
          return {
            disabled: false,
            options: [],
          };
        }

        return {
          disabled: false,
          options: Object.entries(selectedVoice.supportedLocales).map(
            ([locale, info]) => ({
              label: info.detail,
              value: locale,
            })
          ),
        };
      },
    }),
    style: Property.Dropdown({
      displayName: 'Style',
      description: 'Voice style for the speech',
      auth: murfAuth,
      required: false,
      refreshers: ['voiceId', 'multiNativeLocale'],
      options: async ({ auth, voiceId, multiNativeLocale }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        if (!voiceId) {
          return {
            disabled: true,
            placeholder: 'Select a voice first',
            options: [],
          };
        }
        const voices = await murfApiCall<Voice[]>({
          apiKey: auth.secret_text,
          method: HttpMethod.GET,
          endpoint: '/speech/voices',
        });

        const selectedVoice = voices.find((v) => v.voiceId === voiceId);
        if (!selectedVoice?.supportedLocales) {
          return {
            disabled: false,
            options: [],
          };
        }

        const locale =
          (multiNativeLocale as string) || selectedVoice.locale || '';
        const localeInfo = selectedVoice.supportedLocales[locale];
        if (!localeInfo?.availableStyles) {
          return {
            disabled: false,
            options: [],
          };
        }

        return {
          disabled: false,
          options: localeInfo.availableStyles.map((style) => ({
            label: style,
            value: style,
          })),
        };
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Text to convert to speech',
      required: true,
    }),
    format: Property.StaticDropdown({
      displayName: 'Audio Format',
      description: 'Format of the generated audio file',
      required: false,
      defaultValue: 'MP3',
      options: {
        options: [
          { label: 'MP3', value: 'MP3' },
          { label: 'WAV', value: 'WAV' },
          { label: 'FLAC', value: 'FLAC' },
          { label: 'OGG', value: 'OGG' },
          { label: 'ALAW', value: 'ALAW' },
          { label: 'ULAW', value: 'ULAW' },
          { label: 'PCM', value: 'PCM' },
        ],
      },
    }),
    channelType: Property.StaticDropdown({
      displayName: 'Channel Type',
      description: 'Audio channel type',
      required: false,
      defaultValue: 'MONO',
      options: {
        options: [
          { label: 'Mono', value: 'MONO' },
          { label: 'Stereo', value: 'STEREO' },
        ],
      },
    }),
    sampleRate: Property.StaticDropdown({
      displayName: 'Sample Rate',
      description: 'Audio sample rate in Hz',
      required: false,
      defaultValue: 44100,
      options: {
        options: [
          { label: '8000 Hz', value: 8000 },
          { label: '24000 Hz', value: 24000 },
          { label: '44100 Hz', value: 44100 },
          { label: '48000 Hz', value: 48000 },
        ],
      },
    }),
    pitch: Property.Number({
      displayName: 'Pitch',
      description: 'Pitch adjustment (-50 to 50)',
      required: false,
    }),
    rate: Property.Number({
      displayName: 'Speed',
      description: 'Speed adjustment (-50 to 50)',
      required: false,
    }),
    variation: Property.StaticDropdown({
      displayName: 'Variation',
      description: 'Adds variation in pause, pitch, and speed',
      required: false,
      defaultValue: 1,
      options: {
        options: [
          { label: '0 - None', value: 0 },
          { label: '1 - Low', value: 1 },
          { label: '2 - Medium Low', value: 2 },
          { label: '3 - Medium', value: 3 },
          { label: '4 - Medium High', value: 4 },
          { label: '5 - High', value: 5 },
        ],
      },
    }),
    audioDuration: Property.Number({
      displayName: 'Audio Duration',
      description: 'Target duration in seconds (0 to ignore)',
      required: false,
    }),
    encodeAsBase64: Property.Checkbox({
      displayName: 'Encode as Base64',
      description: 'Return audio as Base64 instead of URL',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      text: propsValue.text,
      voiceId: propsValue.voiceId,
      modelVersion: 'GEN2',
    };

    if (propsValue.multiNativeLocale) {
      body['multiNativeLocale'] = propsValue.multiNativeLocale;
    }
    if (propsValue.style) {
      body['style'] = propsValue.style;
    }
    if (propsValue.format) {
      body['format'] = propsValue.format;
    }
    if (propsValue.channelType) {
      body['channelType'] = propsValue.channelType;
    }
    if (propsValue.sampleRate) {
      body['sampleRate'] = propsValue.sampleRate;
    }
    if (propsValue.pitch !== undefined && propsValue.pitch !== null) {
      body['pitch'] = propsValue.pitch;
    }
    if (propsValue.rate !== undefined && propsValue.rate !== null) {
      body['rate'] = propsValue.rate;
    }
    if (propsValue.variation !== undefined && propsValue.variation !== null) {
      body['variation'] = propsValue.variation;
    }
    if (
      propsValue.audioDuration !== undefined &&
      propsValue.audioDuration !== null &&
      propsValue.audioDuration > 0
    ) {
      body['audioDuration'] = propsValue.audioDuration;
    }
    if (propsValue.encodeAsBase64) {
      body['encodeAsBase64'] = propsValue.encodeAsBase64;
    }

    const response = await murfApiCall<{
      audioFile: string;
      audioLengthInSeconds: number;
      remainingCharacterCount: number;
      encodedAudio?: string;
      warning?: string;
    }>({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      endpoint: '/speech/generate',
      body,
    });

    return response;
  },
});
