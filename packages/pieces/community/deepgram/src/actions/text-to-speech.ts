import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { deepgramProps } from '../common/props';
import { deepgramSpeech } from '../common/speech';
import { textToSpeechOutputSchema } from '../output-schemas';

export const textToSpeechAction = createAction({
  auth: deepgramAuth,
  name: 'text_to_speech',
  classification: 'READ',
  displayName: 'Text to Speech',
  description: 'Converts text (up to 2,000 characters) to an audio file.',
  audience: 'human',
  aiMetadata: {
    description:
      'Synthesizes speech from text using a Deepgram Aura voice and saves the result as an audio file in a chosen encoding (mp3 by default). Pick this only for generating spoken audio from text, the inverse of the transcription actions. Each run produces a newly generated, billed audio file, so it is not idempotent. For agents: use Generate Speech.',
    idempotent: false,
  },
  outputSchema: textToSpeechOutputSchema,
  props: {
    text: Property.LongText({
      displayName: 'Text',
      description:
        'Up to 2,000 characters. Split longer text into several steps.',
      required: true,
    }),
    model: deepgramProps.ttsVoice({
      description:
        'Leave empty for aura-asteria-en. Aura-2 voices sound more natural and cover more languages.',
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
    container: Property.StaticDropdown({
      displayName: 'Container',
      description:
        'For linear16, mulaw and alaw only. WAV (default) adds a file header; None returns raw audio for telephony systems.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'WAV', value: 'wav' },
          { label: 'None (raw audio)', value: 'none' },
        ],
      },
    }),
    sampleRate: Property.Number({
      displayName: 'Sample Rate (Hz)',
      description:
        'Optional. linear16: 8000-48000 (default 24000); mulaw/alaw: 8000 or 16000; flac: 8000-48000. Not used for mp3, opus or aac.',
      required: false,
    }),
    bitRate: Property.Number({
      displayName: 'Bit Rate (bps)',
      description:
        'Optional. mp3: 32000 or 48000; opus: 4000-650000; aac: 4000-192000.',
      required: false,
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description:
        'Speaking rate from 0.5 to 1.5 (1 is normal). Not supported by every voice.',
      required: false,
    }),
  },
  async run(context) {
    const { text, model, encoding, container, sampleRate, bitRate, speed } =
      context.propsValue;
    return deepgramSpeech.synthesize({
      apiKey: context.auth.secret_text,
      text,
      model: model?.trim() || 'aura-asteria-en',
      encoding,
      container,
      sampleRate,
      bitRate,
      speed,
      writeFile: ({ fileName, data }) =>
        context.files.write({ fileName, data }),
    });
  },
});
