import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfUtils } from '../common/utils';
import { searchPapersOutputSchema } from '../output-schemas';

export const searchPapers = createAction({
  auth: huggingFaceAuth,
  name: 'search_papers',
  classification: 'SEARCH',
  displayName: 'Search Papers',
  description: 'Search research papers indexed on Hugging Face.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Searches the research papers indexed on Hugging Face Papers with a hybrid semantic and full-text query, returning up to 120 matches with their arXiv-style IDs, titles, authors and summaries. Use it to find papers on a topic; use List Daily Papers for what was featured on a given day and Get Paper for one paper's full details. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: searchPapersOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: "What to search for, up to 250 characters, for example 'retrieval augmented generation'.",
      required: true,
    }),
    limit: hfProps.limit({ defaultValue: 20, max: 120 }),
  },
  async run(context) {
    const { query, limit } = context.propsValue;
    hfUtils.assertLimit({ value: limit, min: 1, max: 120, name: 'Limit' });
    const trimmed = query.trim();
    if (trimmed.length === 0 || trimmed.length > 250) {
      throw new Error('Query must be between 1 and 250 characters.');
    }
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/api/papers/search',
      query: [
        ['q', trimmed],
        ['limit', limit],
      ],
    });
    const papers = Array.isArray(response.body) ? response.body : [];
    return { papers, count: papers.length };
  },
});
