import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { cohereAuth } from '../auth';

export const cohereRerank = createAction({
  auth: cohereAuth,
  name: 'rerank',
  displayName: 'Rerank Documents',
  description: 'Rerank a list of documents based on relevance to a query using Cohere Rerank API',
  audience: 'both',
  aiMetadata: {
    description:
      'Takes a query and a list of text documents and returns relevance scores for each document sorted by semantic match strength.',
    idempotent: true,
  },
  props: {
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The Cohere Rerank model to use',
      required: true,
      defaultValue: 'rerank-v3.5',
      options: {
        options: [
          { label: 'Rerank v3.5', value: 'rerank-v3.5' },
          { label: 'Rerank English v3.0', value: 'rerank-english-v3.0' },
          { label: 'Rerank Multilingual v3.0', value: 'rerank-multilingual-v3.0' },
        ],
      },
    }),
    query: Property.ShortText({
      displayName: 'Query',
      description: 'The search query to rank documents against',
      required: true,
    }),
    documents: Property.Array({
      displayName: 'Documents',
      description: 'List of document strings to rerank',
      required: true,
    }),
    topN: Property.Number({
      displayName: 'Top N',
      description: 'Number of most relevant documents to return (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { model, query, documents, topN } = context.propsValue;

    const body: Record<string, unknown> = {
      model,
      query,
      documents,
    };

    if (topN !== undefined && topN !== null) {
      body['top_n'] = topN;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.cohere.com/v2/rerank',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
