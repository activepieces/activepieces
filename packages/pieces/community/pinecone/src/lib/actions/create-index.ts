import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common';
import { PineconeClient } from '../common/client';
import { commonProps } from '../common/props';

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
      description: 'The dimensions of the vectors to be inserted (1-20000). Required for dense vectors, not needed for sparse vectors.',
      required: false,
    }),
    metric: commonProps.metric,
    vectorType: commonProps.vectorType,
    deletionProtection: commonProps.deletionProtection,
    tags: commonProps.tags,
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
    cloud: commonProps.cloud,
    region: Property.ShortText({
      displayName: 'Region',
      description: 'The region for serverless indexes (e.g., us-west-1)',
      required: false
    }),
    // Metadata configuration
    indexedMetadata: commonProps.indexedMetadata
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
    if (vectorType === 'dense' && dimension) {
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
      const client = new PineconeClient(auth);
      const result = await client.createIndex(requestBody);

      return {
        success: true,
        index: result,
        message: `Index "${name}" created successfully`
      };
    } catch (error: any) {
      throw new Error(`Failed to create index: ${error.message || error}`);
    }
  },
});
