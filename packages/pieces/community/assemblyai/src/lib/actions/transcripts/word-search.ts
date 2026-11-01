import { createAction, Property } from '@activepieces/pieces-framework';
import { assemblyaiAuth } from '../../auth';
import { getAssemblyAIClient } from '../../client';
import { transcriptIdProp } from './shared-props';

export const wordSearch = createAction({
  name: 'wordSearch',
  classification: 'SEARCH',
  auth: assemblyaiAuth,
  requireAuth: true,
  displayName: 'Search Words in Transcript',
  description: 'Find where words or short phrases are said in a transcript.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches an existing transcript, identified by its ID, for one or more keywords and returns where each match occurs (individual words, numbers, or short phrases of up to five tokens). Use this to locate specific terms within a completed transcript. Requires a valid transcript ID and a list of search terms; read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'search',
      display: 'section',
      label: 'Search',
      icon: 'filter',
      props: ['id', 'words'],
    },
  ],
  props: {
    id: transcriptIdProp,
    words: Property.Array({
      displayName: 'Words',
      required: true,
      description: 'Words or phrases of up to five words to look for.',
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
