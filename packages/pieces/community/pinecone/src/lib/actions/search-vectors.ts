import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchVectors = createAction({
  auth: PineconeAuth,
  name: 'searchVectors',
  displayName: 'Search Vectors',
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
      required: false,
      properties: {
        value: Property.Number({
          displayName: 'Value',
          description: 'Vector component value',
          required: true,
        }),
      },
    }),
    sparseVector: Property.Object({
      displayName: 'Sparse Vector',
      description: 'Sparse vector values for hybrid search (optional)',
      required: false,
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
    id: Property.ShortText({
      displayName: 'Vector ID',
      description:
        'The unique ID of the vector to be used as a query vector (alternative to providing vector values)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      topK: propsValue.topK || 10,
      includeValues: propsValue.includeValues || false,
      includeMetadata: propsValue.includeMetadata !== false, // Default to true
    };

    // Either vector values or vector ID must be provided
    if (propsValue.vector && propsValue.vector.length > 0) {
      requestBody.vector = propsValue.vector.map((v: any) => v.value);
    } else if (propsValue.id) {
      requestBody.id = propsValue.id;
    } else {
      throw new Error(
        'Either provide vector values or a vector ID for the query'
      );
    }

    if (propsValue.sparseVector) {
      requestBody.sparseVector = propsValue.sparseVector;
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.filter) {
      requestBody.filter = propsValue.filter;
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
