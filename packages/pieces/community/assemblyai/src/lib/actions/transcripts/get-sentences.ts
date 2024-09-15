import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getSentences = createAction({
  name: 'getTranscriptSentences',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Sentences',
  description: 'Retrieve the sentences of the transcript by its ID.',
  props: {
    id: transcriptIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const sentencesResponse = await client.transcripts.sentences(
      context.propsValue.id
    );
    return sentencesResponse;
  },
});
