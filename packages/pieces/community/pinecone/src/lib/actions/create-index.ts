import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon, indexConfigSchema } from '../common';
import { z } from 'zod';

export const createIndexAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_create_index',
  displayName: 'Create Index',
  description: 'Create a new Pinecone index',
  props: {
    name: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to create',
      required: true,
    }),
    dimension: Property.Number({
      displayName: 'Dimension',
      description: 'The dimension of vectors in this index',
      required: true,
    }),
    metric: Property.StaticDropdown({
      displayName: 'Distance Metric',
      description: 'The distance metric for similarity calculations',
      required: true,
      defaultValue: 'cosine',
      options: {
        options: [
          { label: 'Cosine', value: 'cosine' },
          { label: 'Euclidean', value: 'euclidean' },
          { label: 'Dot Product', value: 'dotproduct' },
        ],
      },
    }),
    cloud: Property.StaticDropdown({
      displayName: 'Cloud Provider',
      description: 'The cloud provider for serverless deployment',
      required: false,
      defaultValue: 'aws',
      options: {
        options: [
          { label: 'AWS', value: 'aws' },
          { label: 'GCP', value: 'gcp' },
          { label: 'Azure', value: 'azure' },
        ],
      },
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      description: 'The region for serverless deployment',
      required: false,
      defaultValue: 'us-east-1',
      options: {
        options: [
          { label: 'us-east-1 (AWS)', value: 'us-east-1' },
          { label: 'us-west-2 (AWS)', value: 'us-west-2' },
          { label: 'eu-west-1 (AWS)', value: 'eu-west-1' },
          { label: 'gcp-starter (GCP)', value: 'gcp-starter' },
          { label: 'azure-eastus (Azure)', value: 'azure-eastus' },
        ],
      },
    }),
    metadata: Property.Json({
      displayName: 'Metadata Config',
      description: 'Metadata configuration for indexing (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { name, dimension, metric, cloud, region, metadata } = context.propsValue;

    // Validate input
    await propsValidation.validateZod(context.propsValue, {
      name: z.string().min(1, 'Index name cannot be empty').max(45, 'Index name too long'),
      dimension: z.number().int().min(1, 'Dimension must be at least 1').max(40000, 'Dimension too large'),
      metric: z.enum(['euclidean', 'cosine', 'dotproduct']),
      cloud: z.enum(['aws', 'gcp', 'azure']).optional(),
      region: z.string().optional(),
    });

    const indexData: any = {
      name,
      dimension,
      metric,
      spec: {
        serverless: {
          cloud: cloud || 'aws',
          region: region || 'us-east-1'
        }
      },
      deletion_protection: 'disabled'
    };

    if (metadata) {
      indexData.metadata_config = metadata;
    }

    try {
      const result = await pineconeCommon.createIndex(context.auth, indexData);
      return {
        success: true,
        index: result,
        message: `Index "${name}" created successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to create index "${name}"`,
      };
    }
  },
});