import { Property, createAction } from '@activepieces/pieces-framework';
import { smallestAiAuth } from '../..';
import { SMALLEST_AI_BASE_URL, SMALLEST_AI_SOURCE_HEADERS } from '../common';

export const speechToText = createAction({
  name: 'speech-to-text',
  auth: smallestAiAuth,
  displayName: 'Speech to Text',
  description: 'Transcribe audio to text using Smallest AI Pulse models.',
  audience: 'both',
  aiMetadata: {
    description:
      'Transcribes an audio file (uploaded as a file or referenced by URL) using Smallest AI Pulse or Pulse Pro. Returns a JSON transcript with optional word timestamps, speaker labels, emotion detection, and PII redaction. Synchronous — no polling needed. Use pulse-pro for maximum English accuracy; pulse for 38-language support and URL-based audio.',
    idempotent: false,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: true,
      defaultValue: 'pulse-pro',
      options: {
        options: [
          {
            label: 'Pulse Pro — highest English accuracy (pre-recorded files only)',
            value: 'pulse-pro',
          },
          {
            label: 'Pulse — 38 languages, supports audio-by-URL',
            value: 'pulse',
          },
        ],
      },
    }),
    audio_file: Property.File({
      displayName: 'Audio File',
      description: 'Upload an audio file (WAV, MP3, FLAC, etc.). Max 250 MB. Works with both models.',
      required: false,
    }),
    audio_url: Property.ShortText({
      displayName: 'Audio URL',
      description: 'URL of a publicly accessible audio file. Only supported by the Pulse model.',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'BCP-47 language code, e.g. "en", "hi", "ta". Leave blank for auto-detection.',
      required: false,
    }),
    word_timestamps: Property.Checkbox({
      displayName: 'Word Timestamps',
      description: 'Return start/end timestamps for each word.',
      required: false,
      defaultValue: false,
    }),
    diarization: Property.Checkbox({
      displayName: 'Speaker Diarization',
      description: 'Identify and label individual speakers.',
      required: false,
      defaultValue: false,
    }),
    emotion_detection: Property.Checkbox({
      displayName: 'Emotion Detection',
      description: 'Detect speaker emotion per utterance.',
      required: false,
      defaultValue: false,
    }),
    redact_pii: Property.Checkbox({
      displayName: 'Redact PII',
      description: 'Automatically redact personal information (names, phone numbers, etc.).',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { model, audio_file, audio_url, language, word_timestamps, diarization, emotion_detection, redact_pii } =
      propsValue;

    if (!audio_file && !audio_url) {
      throw new Error('Provide either an Audio File or an Audio URL.');
    }
    if (audio_url && model === 'pulse-pro') {
      throw new Error('Audio URL input is only supported by the Pulse model, not Pulse Pro. Upload the file directly or switch to the Pulse model.');
    }

    const params = new URLSearchParams({ model });
    if (language) params.set('language', language);
    if (word_timestamps) params.set('word_timestamps', 'true');
    if (diarization) params.set('diarization', 'true');
    if (emotion_detection) params.set('emotion_detection', 'true');
    if (redact_pii) params.set('redact_pii', 'true');

    const endpoint = `${SMALLEST_AI_BASE_URL}/waves/v1/stt/?${params.toString()}`;
    const authHeader = `Bearer ${auth}`;

    let response: Response;

    if (audio_file) {
      const fileData = audio_file.data instanceof Buffer ? audio_file.data : Buffer.from(audio_file.data, 'base64');
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/octet-stream',
          ...SMALLEST_AI_SOURCE_HEADERS,
        },
        body: fileData,
      });
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json',
          ...SMALLEST_AI_SOURCE_HEADERS,
        },
        body: JSON.stringify({ url: audio_url }),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Smallest AI STT error ${response.status}: ${errorText}`);
    }

    return response.json();
  },
});

interface TranscriptResponse {
  status: string;
  transcription: string;
  words: WordTimestamp[];
  language: string;
  metadata: {
    duration: number;
    processing_time_ms: number;
    rtfx: number;
    num_chunks: number;
  };
  request_id: string;
}

interface WordTimestamp {
  word: string;
  start: number;
  end: number;
  speaker?: string;
}
