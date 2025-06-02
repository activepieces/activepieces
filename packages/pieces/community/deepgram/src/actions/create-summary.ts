import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';


export const createSummaryAction = createAction({
  auth: deepgramAuth,
  name: 'create_summary',
  displayName: 'Create Summary',
  description: 'Produces a summary of the content from an audio file',
  props: {
    audioFile: Property.File({
      displayName: 'Audio File',
      required: true,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      required: false,
      options: {
        options: [
          { label: 'Nova', value: 'nova' },
          { label: 'Enhanced', value: 'enhanced' },
        ],
      },
    }),
    fallbackToTranscript: Property.Checkbox({
      displayName: 'Fallback to Full Transcript',
      description: 'Return full transcript if summary is not available',
      required: false,
      defaultValue: true
    })
  },
  async run(context) {
    const { audioFile, model = 'nova', fallbackToTranscript } = context.propsValue;
    const client = createDeepgramClient(context.auth);
    
    const response = await client.post('/listen', {
      body: audioFile.data,
      headers: {
        'Content-Type': 'audio/*',
      },
      queryParams: {
        model,
        summarize: 'true'
      }
    });
    
    if (response.body.results.summary) {
      return response.body.results.summary;
    }

    if (fallbackToTranscript && response.body.results.channels?.[0]?.alternatives?.[0]?.transcript) {
      return response.body.results.channels[0].alternatives[0].transcript;
    }

    throw new Error('No summary or transcript available');
  },
});