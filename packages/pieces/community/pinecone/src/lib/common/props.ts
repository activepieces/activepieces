import { Property } from '@activepieces/pieces-framework';

export const commonProps = {
  indexName: Property.ShortText({
    displayName: 'Index Name',
    description: 'The name of the Pinecone index',
    required: true,
  }),
  
  namespace: Property.ShortText({
    displayName: 'Namespace',
    description: 'The namespace to operate on (optional)',
    required: false,
  }),

  // Vector type options
  vectorType: Property.Dropdown({
    displayName: 'Vector Type',
    description: 'The type of vector to work with',
    required: true,
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

  // Distance metric options
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

  // Deletion protection options
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

  // Cloud provider options
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

  // Tags property
  tags: Property.Json({
    displayName: 'Tags',
    description: 'Custom user tags (optional)',
    required: false,
    defaultValue: {}
  }),

  // Indexed metadata property
  indexedMetadata: Property.Json({
    displayName: 'Indexed Metadata',
    description: 'Metadata fields to be indexed (optional)',
    required: false,
    defaultValue: []
  })
};

export const vectorProps = {
  vectorId: Property.ShortText({
    displayName: 'Vector ID',
    description: 'The unique identifier for the vector',
    required: true,
  }),

  vectorIds: Property.Json({
    displayName: 'Vector IDs',
    description: 'Array of vector IDs',
    required: false,
    defaultValue: ['id-0', 'id-1']
  }),

  values: Property.Json({
    displayName: 'Vector Values',
    description: 'The vector values (array of numbers)',
    required: false,
    defaultValue: [0.1, 0.2, 0.3, 0.4, 0.5]
  }),

  metadata: Property.Json({
    displayName: 'Metadata',
    description: 'Additional metadata for the vector (optional)',
    required: false,
    defaultValue: {}
  }),

  sparseValues: Property.Json({
    displayName: 'Sparse Values',
    description: 'Sparse vector values with indices and values (optional)',
    required: false,
    defaultValue: {
      indices: [0, 1, 2],
      values: [0.1, 0.2, 0.3]
    }
  })
};

export const searchProps = {
  topK: Property.Number({
    displayName: 'Top K',
    description: 'Number of results to return',
    required: false,
    defaultValue: 10
  }),

  includeValues: Property.Checkbox({
    displayName: 'Include Values',
    description: 'Include vector values in the response',
    required: false,
    defaultValue: false
  }),

  includeMetadata: Property.Checkbox({
    displayName: 'Include Metadata',
    description: 'Include metadata in the response',
    required: false,
    defaultValue: true
  }),

  filter: Property.Json({
    displayName: 'Filter',
    description: 'Metadata filter for the search (optional)',
    required: false,
    defaultValue: {}
  })
}; 