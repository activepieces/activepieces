import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { llmrailsAuth } from '../..';

export const datastoreSearch = createAction({
  auth: llmrailsAuth,
  name: 'search',
  displayName: 'Datastore search',
  description: 'Search in datastore',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a semantic search query against an LLMRails datastore (vector store) and returns matching passages. Use to retrieve relevant context from a knowledge base for RAG or question answering. Requires the target datastore ID and a query text; optionally combines dense and sparse embeddings (hybrid) and can return a summarized answer over the results. Read-only and idempotent — repeating the same query returns the same results without side effects.',
    idempotent: true,
  },
  props: {
    datastoreId: Property.ShortText({
      displayName: 'Datastore ID',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
      description: 'Search query',
    }),
    hybrid: Property.Checkbox({
      displayName: 'Hybrid search',
      description: 'Hybrid search is combining dense and sparse embeddings.',
      required: true,
      defaultValue: true,
    }),
    summarize: Property.Checkbox({
      displayName: 'Summarize',
      description: 'Summarizes the datastore search results',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const datastoreId = context.propsValue.datastoreId;

    const request: HttpRequest = {
      url: `https://api.llmrails.com/v1/datastores/${datastoreId}/search`,
      method: HttpMethod.POST,
      body: {
        text: context.propsValue.text,
        summarize: context.propsValue.summarize,
        hybrid: context.propsValue.hybrid,
      },
      headers: {
        'X-API-KEY': context.auth.secret_text,
        Accept: 'application/json',
      },
    };
    const response = await httpClient.sendRequest(request);

    return response.body;
  },
});
