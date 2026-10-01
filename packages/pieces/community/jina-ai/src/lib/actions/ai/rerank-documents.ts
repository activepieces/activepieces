import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { JinaAICommon } from '../../common';
import { jinaAiAuth } from '../../auth';
import { jinaAiRerankDocumentsOutputSchema } from '../../output-schemas';

export const rerankDocumentsAction = createAction({
  auth: jinaAiAuth,
  name: 'jina_ai_rerank_documents',
  outputSchema: jinaAiRerankDocumentsOutputSchema,
  displayName: 'Rerank Documents',
  description: 'Rank documents by relevance to a query.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Rank a list of text documents by relevance to a query using a Jina reranker model; returns each document index with a relevance score, best first. Use it to reorder search or retrieval results. Stateless compute with no side effects.',
    idempotent: true,
  },
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Reranker model id, for example jina-reranker-v3. List Models returns valid ids.',
      required: true,
      defaultValue: 'jina-reranker-v3',
    }),
    query: Property.LongText({
      displayName: 'Query',
      description: 'The query to rank the documents against.',
      required: true,
    }),
    documents: Property.Array({
      displayName: 'Documents',
      description: 'The texts to rank, one per item.',
      required: true,
    }),
    topN: Property.Number({
      displayName: 'Top N',
      description: 'Number of best results to return. Leave empty to return all documents.',
      required: false,
    }),
    returnDocuments: Property.Checkbox({
      displayName: 'Return Documents',
      description: 'Include the document text in each result.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { model, query, documents, topN, returnDocuments } = context.propsValue;
    const texts = JinaAICommon.toStringList({ values: documents });
    if (texts.length === 0) {
      throw new Error('Provide at least one document to rank.');
    }
    const response = await JinaAICommon.makeRequest({
      url: JinaAICommon.apiUrl({ path: '/rerank' }),
      method: HttpMethod.POST,
      auth: context.auth.secret_text,
      body: {
        model,
        query,
        documents: texts,
        ...(typeof topN === 'number' ? { top_n: topN } : {}),
        return_documents: returnDocuments ?? true,
      },
    });
    return response;
  },
});
