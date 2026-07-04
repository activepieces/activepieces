import { createAction } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const getParagraphs = createAction({
  name: 'getTranscriptParagraphs',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Get Transcript Paragraphs',
  description: 'Retrieve the paragraphs of the transcript by its ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the paragraph-level segmentation of an existing transcript, identified by its ID, with per-paragraph text and timestamps. Use this when you need the transcript grouped into paragraphs rather than the raw text or individual sentences. Requires a valid transcript ID; read-only and idempotent.',
    idempotent: true,
  },
  props: {
    id: transcriptIdProp,
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const paragraphsResponse = await client.transcripts.paragraphs(
      context.propsValue.id
    );
    return paragraphsResponse;
  },
});
