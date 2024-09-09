import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../auth';
import { getAssemblyAIClient } from '../client';

export const getTranscript = createAction({
  name: 'get_transcript',
  auth: assemblyaiAuth,
  displayName: 'Get Transcript',
  description: 'Retrieves a transcript by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Transcript ID',
      required: true,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const transcript = await client.transcripts.get(context.propsValue.id);
    return transcript;
  },
});
