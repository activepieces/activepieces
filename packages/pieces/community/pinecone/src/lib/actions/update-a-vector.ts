import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pineconeAuth } from '../..';

export const updateAVector = createAction({
  name: 'update-a-vector',
  displayName: 'Update a Vector',
  description: 'Update a vector in a namespace. If a value is included, it will overwrite the previous value. If a set_metadata is included, the values of the fields specified in it will be added or overwrite the previous value.',
  auth: pineconeAuth,
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the Pinecone index',
      required: true,
    }),
    vectorId: Property.ShortText({
      displayName: 'Vector ID',
      description: 'Vector\'s unique ID (1-512 characters)',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vector to update (optional)',
      required: false,
    }),
    // Vector data options
    updateType: Property.Dropdown({
      displayName: 'Update Type',
      description: 'What type of update to perform',
      required: true,
      defaultValue: 'metadata',
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Update Metadata Only', value: 'metadata' },
            { label: 'Update Vector Values Only', value: 'values' },
            { label: 'Update Both Values and Metadata', value: 'both' }
          ]
        };
      }
    }),
    vectorValues: Property.Json({
      displayName: 'Vector Values',
      description: 'Vector data as an array of numbers (required if updating values)',
      required: false,
      defaultValue: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    }),
    sparseValues: Property.Json({
      displayName: 'Sparse Values',
      description: 'Vector sparse data with indices and values arrays (optional)',
      required: false,
      defaultValue: {
        indices: [0, 1, 2],
        values: [0.1, 0.2, 0.3]
      }
    }),
    setMetadata: Property.Json({
      displayName: 'Set Metadata',
      description: 'Metadata to set for the vector (will add or overwrite existing metadata)',
      required: false,
      defaultValue: {
        genre: "documentary",
        year: 2019,
        updated: true
      }
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      indexName, 
      vectorId, 
      namespace, 
      updateType, 
      vectorValues, 
      sparseValues, 
      setMetadata 
    } = propsValue;

    // Validate vector ID
    if (!vectorId || typeof vectorId !== 'string') {
      throw new Error('Vector ID must be a valid string');
    }

    if (vectorId.length < 1 || vectorId.length > 512) {
      throw new Error('Vector ID must be between 1 and 512 characters');
    }

    // Validate update type requirements
    if (updateType === 'values' || updateType === 'both') {
      if (!vectorValues || !Array.isArray(vectorValues)) {
        throw new Error('Vector values are required when updating values');
      }
      if (vectorValues.length === 0) {
        throw new Error('Vector values array cannot be empty');
      }
      if (!vectorValues.every((val: any) => typeof val === 'number')) {
        throw new Error('All vector values must be numbers');
      }
    }

    if (updateType === 'metadata' || updateType === 'both') {
      if (!setMetadata || typeof setMetadata !== 'object' || setMetadata === null) {
        throw new Error('Metadata is required when updating metadata');
      }
    }

    // Validate sparse values if provided
    if (sparseValues) {
      if (typeof sparseValues !== 'object' || sparseValues === null) {
        throw new Error('Sparse values must be an object');
      }
      
      const { indices, values } = sparseValues as any;
      if (!Array.isArray(indices) || !Array.isArray(values)) {
        throw new Error('Sparse values must have indices and values arrays');
      }
      
      if (indices.length !== values.length) {
        throw new Error('Sparse values indices and values arrays must have the same length');
      }
      
      if (!indices.every((idx: any) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0)) {
        throw new Error('Sparse values indices must be non-negative integers');
      }
      
      if (!values.every((val: any) => typeof val === 'number')) {
        throw new Error('Sparse values must be numbers');
      }
    }

    try {
      // First, get the index host to construct the correct URL
      const indexResponse = await httpClient.sendRequest({
        url: `https://api.pinecone.io/indexes/${indexName}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });

      if (indexResponse.status !== 200) {
        throw new Error(`Failed to get index information: ${indexResponse.status}`);
      }

      const indexInfo = indexResponse.body as any;
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

      // Build the request body
      const requestBody: any = {
        id: vectorId
      };

      // Add vector values if updating values
      if (updateType === 'values' || updateType === 'both') {
        requestBody.values = vectorValues;
      }

      // Add sparse values if provided
      if (sparseValues) {
        requestBody.sparseValues = sparseValues;
      }

      // Add metadata if updating metadata
      if (updateType === 'metadata' || updateType === 'both') {
        requestBody.setMetadata = setMetadata;
      }

      // Add namespace if provided
      if (namespace) {
        requestBody.namespace = namespace;
      }

      // Update the vector
      const updateResponse = await httpClient.sendRequest({
        url: `https://${host}/vectors/update`,
        method: HttpMethod.POST,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        body: requestBody,
      });

      if (updateResponse.status !== 200) {
        throw new Error(`Failed to update vector: ${updateResponse.status} - ${JSON.stringify(updateResponse.body)}`);
      }

      return {
        success: true,
        message: `Successfully updated vector "${vectorId}" in index "${indexName}"${namespace ? ` in namespace "${namespace}"` : ''}`,
        vectorId,
        indexName,
        namespace: namespace || null,
        updateType,
        updatedFields: {
          values: updateType === 'values' || updateType === 'both',
          metadata: updateType === 'metadata' || updateType === 'both',
          sparseValues: !!sparseValues
        },
        requestBody,
        response: updateResponse.body
      };

    } catch (error: any) {
      throw new Error(`Failed to update vector: ${error.message || error}`);
    }
  },
});
