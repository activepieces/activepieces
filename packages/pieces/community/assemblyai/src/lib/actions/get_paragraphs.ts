import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../auth';
import { getAssemblyAIClient } from '../client';

export const getParagraphs = createAction({
  name: 'get_transcript_paragraphs',
  auth: assemblyaiAuth,
  displayName: 'Get Transcript Paragraphs',
  description: 'Retrieve the paragraphs of the transcript by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Transcript ID',
      required: true,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const paragraphsResponse = await client.transcripts.paragraphs(
      context.propsValue.id
    );
    return paragraphsResponse;
  },
});
