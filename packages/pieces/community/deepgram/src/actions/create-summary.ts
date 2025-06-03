import { createAction, Property } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';

export const createSummary = createAction({
  auth: deepgramAuth,
  name: 'create-summary',
  displayName: 'Create Summary',
  description: 'Produces a summary of the content from an audio file using Deepgram\'s summarization feature',
  props: {
    audio_file: Property.File({
      displayName: 'Audio File',
      description: 'The audio file to summarize (supports various formats like MP3, WAV, M4A, etc.)',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'AI model to use for transcription and summarization',
      required: false,
      defaultValue: 'nova-2',
      options: {
        options: [
          { label: 'Nova-2 (Latest)', value: 'nova-2' },
          { label: 'Nova', value: 'nova' },
          { label: 'Enhanced', value: 'enhanced' },
        ],
      },
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'The language of the audio content',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Italian', value: 'it' },
          { label: 'Portuguese', value: 'pt' },
          { label: 'Dutch', value: 'nl' },
          { label: 'Japanese', value: 'ja' },
          { label: 'Korean', value: 'ko' },
          { label: 'Chinese (Mandarin)', value: 'zh' },
          { label: 'Russian', value: 'ru' },
          { label: 'Arabic', value: 'ar' },
          { label: 'Hindi', value: 'hi' },
        ],
      },
    }),
    summarize: Property.StaticDropdown({
      displayName: 'Summary Version',
      description: 'Version of the summarization feature to use',
      required: false,
      defaultValue: 'v2',
      options: {
        options: [
          { label: 'Version 2 (Latest)', value: 'v2' },
          { label: 'Version 1', value: 'v1' },
        ],
      },
    }),
    detect_topics: Property.Checkbox({
      displayName: 'Detect Topics',
      description: 'Detect topics throughout the transcript',
      required: false,
      defaultValue: false,
    }),
    detect_intents: Property.Checkbox({
      displayName: 'Detect Intents',
      description: 'Recognize speaker intent throughout the transcript',
      required: false,
      defaultValue: false,
    }),
    sentiment_analysis: Property.Checkbox({
      displayName: 'Sentiment Analysis',
      description: 'Analyze sentiment throughout the transcript',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createDeepgramClient(auth);
    const audioFile = propsValue.audio_file;
    
    const queryParams: Record<string, string> = {
      punctuate: 'true',
      smart_format: 'true',
    };

    if (propsValue.model) {
      queryParams.model = propsValue.model;
    }
    if (propsValue.language) {
      queryParams.language = propsValue.language;
    }
    if (propsValue.summarize) {
      queryParams.summarize = propsValue.summarize === 'v2' ? 'v2' : 'true';
    }
    if (propsValue.detect_topics) {
      queryParams.topics = 'true';
    }
    if (propsValue.detect_intents) {
      queryParams.intents = 'true';
    }
    if (propsValue.sentiment_analysis) {
      queryParams.sentiment = 'true';
    }

    try {
      const response = await client.post('/listen', {
        body: audioFile.data,
        headers: {
          'Content-Type': 'audio/*',
        },
        queryParams,
      });

      const result = response.body as any;
      
      // Extract the summary and other relevant information
      const summary = result.results?.summary || null;
      const topics = result.results?.topics || null;
      const sentiments = result.results?.sentiments || null;
      const intents = result.results?.intents || null;
      const metadata = result.metadata || null;

      return {
        summary: summary,
        topics: topics,
        sentiments: sentiments,
        intents: intents,
        metadata: metadata,
        full_response: result,
      };
    } catch (error) {
      throw new Error(`Failed to create summary: ${error}`);
    }
  },
});
