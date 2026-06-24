import { Property, createAction } from '@activepieces/pieces-framework';
import { smallestAiAuth } from '../..';
import { SMALLEST_AI_BASE_URL, SMALLEST_AI_SOURCE_HEADERS, PRO_VOICE_IDS, getVoices } from '../common';

export const textToSpeech = createAction({
  name: 'text-to-speech',
  auth: smallestAiAuth,
  displayName: 'Text to Speech',
  description: 'Convert text to speech using Smallest AI Lightning models.',
  audience: 'both',
  aiMetadata: {
    description:
      'Synthesizes spoken audio from text using a Smallest AI voice. Returns a WAV audio file. Supports English, Hindi, and 10+ other languages. Not idempotent — each call generates a new audio file.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      defaultValue: 'lightning_v3.1',
      options: {
        options: [
          { label: 'Lightning v3.1 (multilingual, voice cloning)', value: 'lightning_v3.1' },
          { label: 'Lightning v3.1 Pro (premium English/Hindi voices)', value: 'lightning_v3.1_pro' },
        ],
      },
    }),
    voice_id: Property.Dropdown({
      displayName: 'Voice',
      description: 'Voices update automatically when you change the model.',
      required: true,
      auth: smallestAiAuth,
      refreshers: ['model'],
      refreshOnSearch: false,
      options: async ({ auth, model }) => {
        if (!auth) {
          return { disabled: true, placeholder: 'Enter your API key first', options: [] };
        }
        try {
          const voices = await getVoices({ apiKey: auth as string });
          const isProModel = model === 'lightning_v3.1_pro';
          const filtered = voices.filter((v) =>
            isProModel ? PRO_VOICE_IDS.has(v.voiceId) : !PRO_VOICE_IDS.has(v.voiceId)
          );
          return {
            disabled: false,
            options: filtered.map((v) => ({ label: v.displayName ?? v.voiceId, value: v.voiceId })),
          };
        } catch {
          return { disabled: true, placeholder: "Couldn't load voices — check your API key.", options: [] };
        }
      },
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to convert to speech.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Language',
      required: false,
      refreshers: ['model'],
      options: async ({ model }) => {
        const isProModel = model === 'lightning_v3.1_pro';
        const options = isProModel
          ? [
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' },
            ]
          : [
              { label: 'English', value: 'en' },
              { label: 'Hindi', value: 'hi' },
              { label: 'Marathi', value: 'mr' },
              { label: 'Kannada', value: 'kn' },
              { label: 'Tamil', value: 'ta' },
              { label: 'Bengali', value: 'bn' },
              { label: 'Gujarati', value: 'gu' },
              { label: 'Telugu', value: 'te' },
              { label: 'Malayalam', value: 'ml' },
              { label: 'Punjabi', value: 'pa' },
              { label: 'Odia', value: 'or' },
              { label: 'Spanish', value: 'es' },
            ];
        return { disabled: false, options };
      },
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Output Format',
      required: false,
      defaultValue: 'wav',
      options: {
        options: [
          { label: 'WAV', value: 'wav' },
          { label: 'MP3', value: 'mp3' },
          { label: 'PCM (raw)', value: 'pcm' },
        ],
      },
    }),
    sample_rate: Property.Number({
      displayName: 'Sample Rate (Hz)',
      description: 'Audio sample rate. 24000 recommended; range 8000–44100.',
      required: false,
      defaultValue: 24000,
    }),
    speed: Property.Number({
      displayName: 'Speed',
      description: 'Playback speed multiplier (0.5–2.0). Default is 1.0.',
      required: false,
      defaultValue: 1.0,
    }),
  },
  async run({ auth, propsValue, files }) {
    const outputFormat = propsValue.output_format ?? 'wav';
    const body: Record<string, unknown> = {
      text: propsValue.text,
      voice_id: propsValue.voice_id,
      output_format: outputFormat,
      sample_rate: propsValue.sample_rate ?? 24000,
      speed: propsValue.speed ?? 1.0,
    };

    if (propsValue.model) body['model'] = propsValue.model;
    if (propsValue.language) body['language'] = propsValue.language;

    const mimeMap: Record<string, string> = { wav: 'audio/wav', mp3: 'audio/mpeg', pcm: 'audio/pcm' };
    const acceptMime = mimeMap[outputFormat] ?? 'audio/wav';

    const response = await fetch(`${SMALLEST_AI_BASE_URL}/waves/v1/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
        Accept: acceptMime,
        ...SMALLEST_AI_SOURCE_HEADERS,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Smallest AI TTS error ${response.status}: ${errorText}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());
    const fileName = `audio.${outputFormat}`;

    return files.write({ fileName, data: audioBuffer });
  },
});
