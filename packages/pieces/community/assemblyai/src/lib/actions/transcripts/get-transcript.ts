import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getTranscript = createAction({
  name: 'getTranscript',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript',
  description: 'Retrieves a transcript by its ID.',
  props: {
    id: transcriptIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const transcript = await client.transcripts.get(context.propsValue.id);
    return transcript;
  },
});
