import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pineconeAuth } from '../..';

export const createIndex = createAction({
  name: 'create-index',
  displayName: 'Create Index',
  description: 'Creates a new Pinecone index with custom settings',
  auth: pineconeAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index (1-45 characters, alphanumeric or hyphens only)',
      required: true,
    }),
    dimension: Property.Number({
      displayName: 'Vector Dimension',
      description: 'The dimensions of the vectors to be inserted (1-20000)',
      required: true,
    }),
    metric: Property.Dropdown({
      displayName: 'Distance Metric',
      description: 'The distance metric for similarity search',
      required: true,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Cosine', value: 'cosine' },
            { label: 'Euclidean', value: 'euclidean' },
            { label: 'Dot Product', value: 'dotproduct' }
          ]
        };
      }
    }),
    vectorType: Property.Dropdown({
      displayName: 'Vector Type',
      description: 'The index vector type',
      required: false,
      defaultValue: 'dense',
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Dense', value: 'dense' },
            { label: 'Sparse', value: 'sparse' }
          ]
        };
      }
    }),
    deletionProtection: Property.Dropdown({
      displayName: 'Deletion Protection',
      description: 'Whether deletion protection is enabled',
      required: false,
      defaultValue: 'disabled',
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Disabled', value: 'disabled' },
            { label: 'Enabled', value: 'enabled' }
          ]
        };
      }
    }),
    tags: Property.Json({
      displayName: 'Tags',
      description: 'Custom user tags for the index (optional)',
      required: false,
      defaultValue: {}
    }),
    // Pod-based index configuration
    environment: Property.ShortText({
      displayName: 'Environment',
      description: 'The environment where the index should be hosted (e.g., us-east-1-aws)',
      required: false
    }),
    podType: Property.ShortText({
      displayName: 'Pod Type',
      description: 'The pod type to use (e.g., p1.x1)',
      required: false
    }),
    pods: Property.Number({
      displayName: 'Number of Pods',
      description: 'The number of pods to use',
      required: false,
      defaultValue: 1
    }),
    replicas: Property.Number({
      displayName: 'Number of Replicas',
      description: 'The number of replicas',
      required: false,
      defaultValue: 1
    }),
    shards: Property.Number({
      displayName: 'Number of Shards',
      description: 'The number of shards',
      required: false,
      defaultValue: 1
    }),
    // Serverless configuration
    cloud: Property.Dropdown({
      displayName: 'Cloud Provider',
      description: 'The cloud provider for serverless indexes',
      required: false,
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'AWS', value: 'aws' },
            { label: 'GCP', value: 'gcp' },
            { label: 'Azure', value: 'azure' }
          ]
        };
      }
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description: 'The region for serverless indexes (e.g., us-west-1)',
      required: false
    }),
    // Metadata configuration
    indexedMetadata: Property.Json({
      displayName: 'Indexed Metadata',
      description: 'Metadata fields to be indexed (optional)',
      required: false,
      defaultValue: []
    })
  },
  async run({ auth, propsValue }) {
    const { name, dimension, metric, vectorType = 'dense', deletionProtection = 'disabled', tags = {} } = propsValue;
    
    // Validate vector type and dimension combination
    if (vectorType === 'sparse' && dimension) {
      throw new Error('Dimension should not be specified for sparse vector types');
    }
    
    if (vectorType === 'dense' && !dimension) {
      throw new Error('Dimension must be specified for dense vector types');
    }
    
    // Validate metric for sparse vectors
    if (vectorType === 'sparse' && metric !== 'dotproduct') {
      throw new Error('Metric must be "dotproduct" for sparse vector types');
    }

    // Build the request body
    const requestBody: any = {
      name,
      metric,
      vector_type: vectorType,
      deletion_protection: deletionProtection
    };

    // Add dimension for dense vectors
    if (vectorType === 'dense') {
      requestBody.dimension = dimension;
    }

    // Add tags if provided
    if (Object.keys(tags).length > 0) {
      requestBody.tags = tags;
    }

    // Build spec object based on provided configuration
    if (propsValue.environment && propsValue.podType) {
      // Pod-based index
      requestBody.spec = {
        pod: {
          environment: propsValue.environment,
          pod_type: propsValue.podType,
          pods: propsValue.pods || 1,
          replicas: propsValue.replicas || 1,
          shards: propsValue.shards || 1
        }
      };
      
      // Add metadata config if provided
      if (propsValue.indexedMetadata && Array.isArray(propsValue.indexedMetadata) && propsValue.indexedMetadata.length > 0) {
        requestBody.spec.pod.metadata_config = {
          indexed: propsValue.indexedMetadata
        };
      }
    } else if (propsValue.cloud && propsValue.region) {
      // Serverless index
      requestBody.spec = {
        serverless: {
          cloud: propsValue.cloud,
          region: propsValue.region
        }
      };
    } else {
      throw new Error('Either provide environment and podType for pod-based indexes, or cloud and region for serverless indexes');
    }

    try {
      const response = await httpClient.sendRequest({
        url: 'https://api.pinecone.io/indexes',
        method: HttpMethod.POST,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        body: requestBody,
      });

      if (response.status === 201) {
        return {
          success: true,
          index: response.body,
          message: `Index "${name}" created successfully`
        };
      } else {
        throw new Error(`Failed to create index: ${response.status}`);
      }
    } catch (error: any) {
      throw new Error(`Failed to create index: ${error.message || error}`);
    }
  },
});
