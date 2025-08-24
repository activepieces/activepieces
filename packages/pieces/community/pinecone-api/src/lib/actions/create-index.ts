import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClient } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const createIndex = createAction({
  auth: pineconeAuth,
  name: 'create_index',
  displayName: 'Create Index',
  description: 'Creates a new Pinecone index with custom settings. At minimum, you must specify a name, dimension, and spec.',
  props: {
    name: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to create (e.g., "sample-index")',
      required: true,
    }),
    dimension: Property.Number({
      displayName: 'Dimension',
      description: 'The size of the vectors you intend to store. For OpenAI text-embedding-ada-002 model, use 1536.',
      required: true,
      defaultValue: 1536,
    }),
    cloud: Property.StaticDropdown({
      displayName: 'Cloud Provider',
      description: 'The cloud provider where the index should be hosted',
      required: true,
      options: {
        options: [
          { label: 'AWS', value: 'aws' },
          { label: 'GCP', value: 'gcp' },
          { label: 'Azure', value: 'azure' },
        ],
      },
      defaultValue: 'aws',
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description: 'The region where the index should be hosted (e.g., "us-west-2")',
      required: true,
      defaultValue: 'us-west-2',
    }),
    metric: Property.StaticDropdown({
      displayName: 'Metric',
      description: 'The distance metric to use for similarity search',
      required: false,
      options: {
        options: [
          { label: 'Cosine', value: 'cosine' },
          { label: 'Euclidean', value: 'euclidean' },
          { label: 'Dot Product', value: 'dotproduct' },
        ],
      },
    }),
    tags: Property.Json({
      displayName: 'Tags',
      description: 'Optional tags for the index (e.g., {"team": "data-science"})',
      required: false,
    }),
  },
  async run(context) {
    const { name, dimension, cloud, region, metric, tags } = context.propsValue;
    const apiKey = context.auth;

    // Initialize Pinecone client following SDK example
    const pc = createPineconeClient(apiKey);

    try {
      // Create index following the exact SDK documentation structure
      const response = await pc.createIndex({
        name: name,
        dimension: dimension,
        spec: {
          serverless: {
            cloud: cloud as 'aws' | 'gcp' | 'azure',
            region: region,
          },
        },
        ...(metric && { metric: metric as 'cosine' | 'euclidean' | 'dotproduct' }),
        ...(tags && { tags: tags as Record<string, string> }),
      });

      return {
        success: true,
        indexName: name,
        dimension: dimension,
        cloud: cloud,
        region: region,
        ...(metric && { metric: metric }),
        ...(tags && { tags: tags }),
        message: 'Index created successfully',
      };
    } catch (caught) {
      console.log('Failed to create index.', caught);
      return caught;
    }
  },
});