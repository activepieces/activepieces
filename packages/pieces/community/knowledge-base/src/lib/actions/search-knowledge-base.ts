import { createAction, PieceAuth, Property } from '@activepieces/pieces-framework';
import axios, { AxiosError } from 'axios';

export const searchKnowledgeBase = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'searchKnowledgeBase',
  displayName: 'Search Knowledge Base',
  description: "Search for any information in Avalant's knowledge base",
  auth: PieceAuth.None(),
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The query to search for in the knowledge base',
      required: true,
    }),
    knowledgeBaseId: Property.ShortText({
      displayName: 'Knowledge Base ID',
      description: 'The knowledge base ID to search in',
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
    const URL = 'https://ml.oneweb.tech/api/dify_kb/retrieval'
    const { query, knowledgeBaseId, topK, scoreThreshold } = context.propsValue;
    let openID = JSON.parse(localStorage.getItem("openID") || '""');
    let apiKey = openID?.access_token;

    try {
      const response = await axios.post(
        URL,
        {
          query: query,
          knowledge_id: knowledgeBaseId,
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
        const axiosError: any = error as AxiosError;
        throw new Error(
          `Dify API Error: ${axiosError.response?.data?.message ||
          axiosError.message ||
          'Unknown error occurred'
          }`
        );
      }
      throw new Error(`Unexpected error: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
