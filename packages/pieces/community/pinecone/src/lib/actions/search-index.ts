import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchIndex = createAction({
  auth: PineconeAuth,
  name: 'searchIndex',
  displayName: 'Search Index',
  description: 'Queries a Pinecone index with a vector to find similar records',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to search',
      required: true,
    }),
    vector: Property.Array({
      displayName: 'Query Vector',
      description: 'The query vector values as an array of numbers',
      required: true,
      properties: {
        value: Property.Number({
          displayName: 'Value',
          description: 'Vector component value',
          required: true,
        }),
      },
    }),
    topK: Property.Number({
      displayName: 'Top K',
      description: 'Number of most similar results to return',
      required: false,
      defaultValue: 10,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to search within (optional)',
      required: false,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description: 'Metadata filter to apply to the search (optional)',
      required: false,
    }),
    includeValues: Property.Checkbox({
      displayName: 'Include Values',
      description: 'Whether to include vector values in the response',
      required: false,
      defaultValue: false,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Whether to include metadata in the response',
      required: false,
      defaultValue: true,
    }),
    sparseVector: Property.Object({
      displayName: 'Sparse Vector',
      description: 'Sparse vector values for hybrid search (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Transform vector array to number array
    const queryVector = propsValue.vector.map((v: any) => v.value);

    const requestBody: any = {
      vector: queryVector,
      topK: propsValue.topK || 10,
      includeValues: propsValue.includeValues || false,
      includeMetadata: propsValue.includeMetadata !== false, // Default to true
    };

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.filter) {
      requestBody.filter = propsValue.filter;
    }

    if (propsValue.sparseVector) {
      requestBody.sparseVector = propsValue.sparseVector;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/query',
      requestBody
    );

    return response;
  },
});