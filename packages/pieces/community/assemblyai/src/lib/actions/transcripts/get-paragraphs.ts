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
