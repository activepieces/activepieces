import { createAction, Property } from '@activepieces/pieces-framework';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { greenptAuth } from '../common/auth';

export const transcribeAudio = createAction({
  audience: 'both',
  auth: greenptAuth,
  name: 'transcribeAudio',
  classification: 'READ',
  displayName: 'Transcribe Audio',
  description:
    'Turn a recorded audio file into text.',
  aiMetadata: { description: 'Transcribes a pre-recorded audio file with a GreenPT speech-to-text model (green-s or green-s-pro), with optional speaker diarization, punctuation, smart formatting, filler words, numeral conversion, and sentiment, topic, or intent analysis. Requires the audio as a file input, supplied either as base64 data or as a URL the engine fetches, language defaults to English unless a code is supplied, and only the plain transcript text is returned. Use this for speech input; use Ask GreenPT for text generation. Read-only inference and idempotent: nothing is created and the same file with the same options yields the same transcript.', idempotent: true },
  propertyGroups: [
    {
      key: 'audio',
      display: 'section',
      label: 'Audio',
      icon: 'file',
      props: ['audioUrl', 'model', 'language'],
    },
    {
      key: 'transcript',
      display: 'section',
      label: 'Transcript',
      icon: 'text',
      props: ['punctuate', 'smart_format', 'filler_words', 'numerals'],
    },
  ],
  props: {
    audioUrl: Property.File({
      displayName: 'Audio File',
      description: 'The recording to transcribe, such as WAV, MP3 or FLAC.',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Pro handles mixed languages.',
      width: 'half',
      required: false,
      defaultValue: 'green-s',
      options: {
        disabled: false,
        options: [
          {
            label: 'Green S',
            value: 'green-s',
          },
          {
            label: 'Green S Pro',
            value: 'green-s-pro',
          },
        ],
      },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Empty: English.',
      placeholder: 'fr, or multi (Pro)',
      width: 'half',
      required: false,
    }),
    punctuate: Property.Checkbox({
      displayName: 'Add Punctuation',
      description: 'Add punctuation and capital letters.',
      required: false,
      defaultValue: true,
    }),
    smart_format: Property.Checkbox({
      displayName: 'Smart Format',
      description: 'Format dates and amounts. English and Green S only.',
      required: false,
      defaultValue: false,
    }),
    filler_words: Property.Checkbox({
      displayName: 'Include Filler Words',
      description: 'Keep words like "uh" and "um".',
      required: false,
      defaultValue: false,
    }),
    numerals: Property.Checkbox({
      displayName: 'Use Digits for Numbers',
      description: 'Write numbers as digits, such as 42 instead of forty-two.',
      required: false,
      defaultValue: false,
    }),
    diarize: Property.Checkbox({
      displayName: 'Identify Speakers',
      description:
        "Detects who is speaking; labels are not in this step's output.",
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    sentiment: Property.Checkbox({
      displayName: 'Analyze Sentiment',
      description:
        "Runs sentiment analysis; results are not in this step's output.",
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    topics: Property.Checkbox({
      displayName: 'Detect Topics',
      description:
        "Detects topics; results are not in this step's output.",
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    intents: Property.Checkbox({
      displayName: 'Recognize Intents',
      description:
        "Recognizes intents; results are not in this step's output.",
      advanced: true,
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      audioUrl,
      model,
      language,
      diarize,
      punctuate,
      smart_format,
      filler_words,
      numerals,
      sentiment,
      topics,
      intents,
    } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (model) {
      queryParams.append('model', model);
    }
    if (language) {
      queryParams.append('language', language);
    }
    if (diarize) queryParams.append('diarize', 'true');
    if (punctuate) queryParams.append('punctuate', 'true');
    if (smart_format) queryParams.append('smart_format', 'true');
    if (filler_words) queryParams.append('filler_words', 'true');
    if (numerals) queryParams.append('numerals', 'true');
    if (sentiment) queryParams.append('sentiment', 'true');
    if (topics) queryParams.append('topics', 'true');
    if (intents) queryParams.append('intents', 'true');

    const url = `https://api.greenpt.ai/v1/listen?${queryParams.toString()}`;

    const fileData = audioUrl.data;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: url,
      headers: {
        Authorization: `Token ${context.auth.secret_text}`,
        'Content-Type': 'audio/wav',
      },
      body: fileData,
    });

    return response.body.results.channels[0].alternatives[0].transcript;
  },
});
