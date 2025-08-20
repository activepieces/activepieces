import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateAVector = createAction({
  auth: PineconeAuth,
  name: 'updateAVector',
  displayName: 'Update a Vector',
  description: 'Update an existing vector in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index containing the vector to update',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: 'Unique identifier for the vector to update',
      required: true,
    }),
    values: Property.Array({
      displayName: 'Vector Values',
      description: 'The new vector values as an array of numbers (optional)',
      required: false,
      properties: {
        value: Property.Number({
          displayName: 'Value',
          description: 'Vector component value',
          required: true,
        }),
      },
    }),
    sparseValues: Property.Object({
      displayName: 'Sparse Values',
      description: 'New sparse vector values (optional)',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'New metadata to associate with the vector (optional)',
      required: false,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vector to update (optional)',
      required: false,
    }),
    setMetadata: Property.Object({
      displayName: 'Set Metadata',
      description: 'Metadata fields to set (replaces existing fields)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      id: propsValue.id,
    };

    if (propsValue.values && propsValue.values.length > 0) {
      requestBody.values = propsValue.values.map((v: any) => v.value);
    }

    if (propsValue.sparseValues) {
      requestBody.sparseValues = propsValue.sparseValues;
    }

    if (propsValue.metadata) {
      requestBody.metadata = propsValue.metadata;
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.setMetadata) {
      requestBody.setMetadata = propsValue.setMetadata;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/update',
      requestBody
    );

    return response;
  },
});