import { createAction, Property, PieceAuth } from '@activepieces/pieces-framework';
import axios, { AxiosError } from 'axios';

export const searchKnowledgebase = createAction({
  name: 'search_knowledgebase',
  displayName: 'Search Knowledgebase',
  description: 'Search Dify knowledgebase using a query',
  auth: PieceAuth.None(),
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The query to search for in the knowledgebase',
      required: true,
    }),
    knowledgebase: Property.ShortText({
      displayName: 'Knowledgebase',
      description: 'The knowledgebase ID to search in',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of top results to return (1-10)',
      required: true,
      defaultValue: 3,
    }),
    scoreThreshold: Property.Number({
      displayName: 'Score Threshold',
      description: 'Minimum similarity score threshold (0.0 to 1.0)',
      required: false,
      defaultValue: 0.5,
    }),
  },
  async run(context) {
    const { query, knowledgebase, topK, scoreThreshold } = context.propsValue;
    let openID = JSON.parse(localStorage.getItem("openID") || '""');
    let apiKey = openID?.access_token;

    try {
      const response = await axios.post(
        `https://ml.oneweb.tech/api/dify_kb/retrieval`,
        {
          query: query,
          knowledge_id: knowledgebase,
          retrieval_setting: {
            top_k: topK,
            score_threshold: scoreThreshold,
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError:any = error as AxiosError;
        throw new Error(
          `Dify API Error: ${
            axiosError.response?.data?.message || 
            axiosError.message || 
            'Unknown error occurred'
          }`
        );
      }
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
