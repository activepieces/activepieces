import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../auth';
import { getAssemblyAIClient } from '../client';

export const getSentences = createAction({
  name: 'get_transcript_sentences',
  auth: assemblyaiAuth,
  displayName: 'Get Transcript Sentences',
  description: 'Retrieve the sentences of the transcript by its ID.',
  props: {
    id: Property.ShortText({
      displayName: 'Transcript ID',
      required: true,
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const sentencesResponse = await client.transcripts.sentences(
      context.propsValue.id
    );
    return sentencesResponse;
  },
});
