import { createAction, Property } from '@activepieces/pieces-framework';

import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { greenptAuth } from '../common/auth';

export const transcribeAudio = createAction({
  auth: greenptAuth,
  name: 'transcribeAudio',
  displayName: 'Transcribe Audio',
  description:
    'Transcribe pre-recorded audio files with speaker diarization and advanced features',
  props: {
    audioUrl: Property.File({
      displayName: 'Audio File',
      description: 'Audio file to transcribe (WAV, MP3, FLAC, etc.)',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'Speech-to-text model to use',
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
      description:
        'Language code (e.g., en, fr, de). Auto-detected if not specified',
      required: false,
    }),
    diarize: Property.Checkbox({
      displayName: 'Speaker Diarization',
      description: 'Enable speaker diarization to identify different speakers',
      required: false,
      defaultValue: false,
    }),
    punctuate: Property.Checkbox({
      displayName: 'Punctuate',
      description: 'Add punctuation and capitalization to transcript',
      required: false,
      defaultValue: true,
    }),
    smart_format: Property.Checkbox({
      displayName: 'Smart Format',
      description:
        'Apply formatting to transcript output for improved readability',
      required: false,
      defaultValue: false,
    }),
    filler_words: Property.Checkbox({
      displayName: 'Include Filler Words',
      description: 'Include filler words like "uh" and "um" in transcript',
      required: false,
      defaultValue: false,
    }),
    numerals: Property.Checkbox({
      displayName: 'Convert Numerals',
      description: 'Convert numbers from written format to numerical format',
      required: false,
      defaultValue: false,
    }),
    sentiment: Property.Checkbox({
      displayName: 'Analyze Sentiment',
      description: 'Analyze sentiment throughout the transcript',
      required: false,
      defaultValue: false,
    }),
    topics: Property.Checkbox({
      displayName: 'Detect Topics',
      description: 'Detect topics throughout the transcript',
      required: false,
      defaultValue: false,
    }),
    intents: Property.Checkbox({
      displayName: 'Recognize Intents',
      description: 'Recognize speaker intent throughout the transcript',
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
