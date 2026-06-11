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
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the sentence-level segmentation of an existing transcript, identified by its ID, with per-sentence text and timestamps. Use this when you need the transcript broken into sentences rather than the raw text. Requires a valid transcript ID; read-only and idempotent.',
    idempotent: true,
  },
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
