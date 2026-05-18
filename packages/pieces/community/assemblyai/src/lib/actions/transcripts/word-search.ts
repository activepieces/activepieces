import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const wordSearch = createAction({
  name: 'wordSearch',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Search words in transcript',
  description:
    'Search through the transcript for keywords. ' +
    'You can search for individual words, numbers, or phrases containing up to five words or numbers.',
  props: {
    id: transcriptIdProp,
    words: Property.Array({
      displayName: 'Words',
      required: true,
      description: 'Keywords to search for',
    }),
  },
  async run(context) {
    const client = getAssemblyAIClient(context);
    const wordSearchResponse = await client.transcripts.wordSearch(
      context.propsValue.id,
      context.propsValue.words as string[]
    );
    return wordSearchResponse;
  },
});
