import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';
import { commonProps, vectorProps } from '../common/props';

interface SparseValues {
  indices: number[];
  values: number[];
}

interface UpdateVectorRequestBody {
  id: string;
  values?: number[];
  sparseValues?: SparseValues;
  setMetadata?: Record<string, unknown>;
  namespace?: string;
}

export const updateAVector = createAction({
  name: 'update-a-vector',
  displayName: 'Update a Vector',
  description: 'Update a vector in a namespace. If a value is included, it will overwrite the previous value. If a set_metadata is included, the values of the fields specified in it will be added or overwrite the previous value.',
  auth: pineconeAuth,
  props: {
    indexName: commonProps.indexName,
    vectorId: vectorProps.vectorId,
    namespace: commonProps.namespace,
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
    vectorValues: vectorProps.values,
    sparseValues: vectorProps.sparseValues,
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
      if (!vectorValues.every((val: number) => typeof val === 'number')) {
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
      
      const { indices, values } = sparseValues as unknown as SparseValues;
      if (!Array.isArray(indices) || !Array.isArray(values)) {
        throw new Error('Sparse values must have indices and values arrays');
      }
      
      if (indices.length !== values.length) {
        throw new Error('Sparse values indices and values arrays must have the same length');
      }
      
      if (!indices.every((idx: number) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0)) {
        throw new Error('Sparse values indices must be non-negative integers');
      }
      
      if (!values.every((val: number) => typeof val === 'number')) {
        throw new Error('Sparse values values must be numbers');
      }
    }

    try {
      const client = new PineconeClient(auth);
      
      // First, get the index host to construct the correct URL
      const indexInfo = await client.getIndex(indexName);
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

      // Build the request body
      const requestBody: UpdateVectorRequestBody = {
        id: vectorId
      };

      // Add vector values if updating values
      if (updateType === 'values' || updateType === 'both') {
        requestBody.values = vectorValues as unknown as number[];
      }

      // Add sparse values if provided
      if (sparseValues) {
        requestBody.sparseValues = sparseValues as unknown as SparseValues;
      }

      // Add metadata if updating metadata
      if (updateType === 'metadata' || updateType === 'both') {
        requestBody.setMetadata = setMetadata as Record<string, unknown>;
      }

      // Add namespace if provided
      if (namespace) {
        requestBody.namespace = namespace;
      }

      // Update the vector
      const updateResult = await client.updateVector(host, requestBody);

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
        response: updateResult
      };

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to update vector: ${errorMessage}`);
    }
  },
});
