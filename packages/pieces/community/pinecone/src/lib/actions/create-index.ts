import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';
import { commonProps } from '../common/props';

interface CreateIndexRequestBody {
  name: string;
  metric: string;
  vector_type: string;
  deletion_protection: string;
  dimension?: number;
  tags?: Record<string, unknown>;
  spec?: {
    pod?: {
      environment: string;
      pod_type: string;
      pods: number;
      replicas: number;
      shards: number;
      metadata_config?: {
        indexed: string[];
      };
    };
    serverless?: {
      cloud: string;
      region: string;
    };
  };
}

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

    cloud: commonProps.cloud,
    region: Property.ShortText({
      displayName: 'Region',
      description: 'The region for serverless indexes (e.g., us-west-1)',
      required: false
    }),
    indexedMetadata: commonProps.indexedMetadata
  },
  async run({ auth, propsValue }) {
    const { name, dimension, metric, vectorType = 'dense', deletionProtection = 'disabled', tags = {} } = propsValue;
    
    if (vectorType === 'sparse' && dimension) {
      throw new Error('Dimension should not be specified for sparse vector types');
    }
    
    if (vectorType === 'dense' && !dimension) {
      throw new Error('Dimension must be specified for dense vector types');
    }

    if (vectorType === 'sparse' && metric !== 'dotproduct') {
      throw new Error('Metric must be "dotproduct" for sparse vector types');
    }

    const requestBody: CreateIndexRequestBody = {
      name,
      metric,
      vector_type: vectorType,
      deletion_protection: deletionProtection
    };

    if (vectorType === 'dense' && dimension) {
      requestBody.dimension = dimension;
    }

    if (Object.keys(tags).length > 0) {
      requestBody.tags = tags;
    }

    if (propsValue.environment && propsValue.podType) {
      requestBody.spec = {
        pod: {
          environment: propsValue.environment,
          pod_type: propsValue.podType,
          pods: propsValue.pods || 1,
          replicas: propsValue.replicas || 1,
          shards: propsValue.shards || 1
        }
      };

      if (propsValue.indexedMetadata && Array.isArray(propsValue.indexedMetadata) && propsValue.indexedMetadata.length > 0) {
        if (requestBody.spec?.pod) {
          requestBody.spec.pod.metadata_config = {
            indexed: propsValue.indexedMetadata
          };
        }
      }
    } else if (propsValue.cloud && propsValue.region) {
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no pod quota available')) {
        throw new Error(`Failed to create index: ${errorMessage}. This usually means your project has reached its pod quota limit. Try using a serverless index instead by providing 'cloud' and 'region' instead of 'environment' and 'podType'.`);
      }
      if (errorMessage.includes('403') || errorMessage.includes('FORBIDDEN')) {
        throw new Error(`Failed to create index: ${errorMessage}. This might be due to insufficient permissions, account verification issues, or pod quota limits. For new accounts, try using serverless indexes with 'cloud' and 'region' parameters.`);
      }
      
      throw new Error(`Failed to create index: ${errorMessage}`);
    }
  },
});
