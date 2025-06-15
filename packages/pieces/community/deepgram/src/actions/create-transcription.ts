import { Property, createAction } from '@activepieces/pieces-framework';
import { deepgramAuth } from '../common/auth';
import { createDeepgramClient } from '../common/client';


export const createTranscriptionCallbackAction = createAction({
  auth: deepgramAuth,
  name: 'create_transcription_callback',
  displayName: 'Create Transcription (Callback)',
  description: 'Creates a transcription using a callback URL',
  props: {
    audioUrl: Property.ShortText({
      displayName: 'Audio URL',
      description: 'Publicly accessible URL of the audio file',
      required: true,
    }),
    callbackUrl: Property.ShortText({
      displayName: 'Callback URL',
      description: 'URL to receive the transcription when ready',
      required: true,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' }
        ],
      },
    }),
    tier: Property.StaticDropdown({
      displayName: 'Tier',
      required: false,
      options: {
        options: [
          { label: 'Base', value: 'base' },
          { label: 'Enhanced', value: 'enhanced' }
        ],
      },
    })
  },
  async run(context) {
    const { audioUrl, callbackUrl, language, tier } = context.propsValue;
    const client = createDeepgramClient(context.auth);
    
    const response = await client.post('/listen', {
      body: {
        url: audioUrl,
        callback: callbackUrl,
      }
    });
    
    return { 
      requestId: response.body.request_id,
      callbackUrl,
      status: 'submitted'
    };
  },
});