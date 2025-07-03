import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const deleteTranscript = createAction({
  name: 'deleteTranscript',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Delete transcript',
  description: 'Remove the data from the transcript and mark it as deleted.',
  props: {
    id: transcriptIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const deleteResponse = await client.transcripts.delete(
      context.propsValue.id
    );
    return deleteResponse;
  },
});
