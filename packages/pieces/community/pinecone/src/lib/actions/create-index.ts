import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createIndex = createAction({
  auth: PineconeAuth,
  name: 'createIndex',
  displayName: 'Create Index',
  description: 'Creates a new Pinecone index with custom settings',
  props: {
    name: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to create',
      required: true,
    }),
    dimension: Property.Number({
      displayName: 'Dimension',
      description: 'The dimension of the vectors to be inserted in the index (required for dense vectors)',
      required: false,
    }),
    vector_type: Property.StaticDropdown({
      displayName: 'Vector Type',
      description: 'The index vector type. Use dense or sparse.',
      required: false,
      defaultValue: 'dense',
      options: {
        options: [
          { label: 'Dense', value: 'dense' },
          { label: 'Sparse', value: 'sparse' },
        ],
      },
    }),
    metric: Property.StaticDropdown({
      displayName: 'Metric',
      description: 'The distance metric to be used for similarity search',
      required: false,
      defaultValue: 'cosine',
      options: {
        options: [
          { label: 'Cosine', value: 'cosine' },
          { label: 'Euclidean', value: 'euclidean' },
          { label: 'Dot Product', value: 'dotproduct' },
        ],
      },
    }),
    spec_type: Property.StaticDropdown({
      displayName: 'Spec Type',
      description: 'The type of index specification',
      required: false,
      defaultValue: 'serverless',
      options: {
        options: [
          { label: 'Serverless', value: 'serverless' },
          { label: 'Pod', value: 'pod' },
          { label: 'BYOC', value: 'byoc' },
        ],
      },
    }),
    // Serverless and Pod spec properties
    cloud: Property.StaticDropdown({
      displayName: 'Cloud Provider',
      description: 'The cloud provider where the index will be hosted',
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
    region: Property.ShortText({
      displayName: 'Region',
      description: 'The region where the index will be hosted (e.g., us-east-1)',
      required: false,
      defaultValue: 'us-east-1',
    }),
    // BYOC spec properties
    environment: Property.ShortText({
      displayName: 'Environment',
      description: 'The BYOC environment (e.g., aws-us-east-1-b921)',
      required: false,
    }),
    // Pod spec properties
    replicas: Property.Number({
      displayName: 'Replicas',
      description: 'The number of replicas for the index (pod spec only)',
      required: false,
      defaultValue: 1,
    }),
    shards: Property.Number({
      displayName: 'Shards',
      description: 'The number of shards for the index (pod spec only)',
      required: false,
      defaultValue: 1,
    }),
    pods: Property.Number({
      displayName: 'Pods',
      description: 'The number of pods for the index (pod spec only)',
      required: false,
      defaultValue: 1,
    }),
    pod_type: Property.StaticDropdown({
      displayName: 'Pod Type',
      description: 'The type of pod to use for the index (pod spec only)',
      required: false,
      defaultValue: 'p1.x1',
      options: {
        options: [
          { label: 'p1.x1', value: 'p1.x1' },
          { label: 'p1.x2', value: 'p1.x2' },
          { label: 'p1.x4', value: 'p1.x4' },
          { label: 'p1.x8', value: 'p1.x8' },
          { label: 'p2.x1', value: 'p2.x1' },
          { label: 'p2.x2', value: 'p2.x2' },
          { label: 'p2.x4', value: 'p2.x4' },
          { label: 'p2.x8', value: 'p2.x8' },
          { label: 's1.x1', value: 's1.x1' },
          { label: 's1.x2', value: 's1.x2' },
          { label: 's1.x4', value: 's1.x4' },
          { label: 's1.x8', value: 's1.x8' },
        ],
      },
    }),
    deletion_protection: Property.StaticDropdown({
      displayName: 'Deletion Protection',
      description: 'Whether deletion protection is enabled/disabled for the index',
      required: false,
      defaultValue: 'disabled',
      options: {
        options: [
          { label: 'Disabled', value: 'disabled' },
          { label: 'Enabled', value: 'enabled' },
        ],
      },
    }),
    metadata_config: Property.Object({
      displayName: 'Metadata Configuration',
      description: 'Configuration for metadata indexing (optional)',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Custom user tags added to an index. Keys must be 80 characters or less, values must be 120 characters or less.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      name: propsValue.name,
    };

    if (propsValue.vector_type) {
      requestBody.vector_type = propsValue.vector_type;
    }

    if (propsValue.dimension && (propsValue.vector_type === 'dense' || !propsValue.vector_type)) {
      requestBody.dimension = propsValue.dimension;
    }

    if (propsValue.metric) {
      requestBody.metric = propsValue.metric;
    }

    if (propsValue.deletion_protection) {
      requestBody.deletion_protection = propsValue.deletion_protection;
    }

    const spec: any = {};
    const specType = propsValue.spec_type || 'serverless';

    if (specType === 'serverless') {
      spec.serverless = {};
      if (propsValue.cloud) spec.serverless.cloud = propsValue.cloud;
      if (propsValue.region) spec.serverless.region = propsValue.region;
    } else if (specType === 'byoc') {
      spec.byoc = {};
      if (propsValue.environment) spec.byoc.environment = propsValue.environment;
    } else if (specType === 'pod') {
      spec.pod = {};
      if (propsValue.cloud) spec.pod.environment = propsValue.cloud;
      if (propsValue.region) spec.pod.region = propsValue.region;
      if (propsValue.replicas) spec.pod.replicas = propsValue.replicas;
      if (propsValue.shards) spec.pod.shards = propsValue.shards;
      if (propsValue.pods) spec.pod.pods = propsValue.pods;
      if (propsValue.pod_type) spec.pod.pod_type = propsValue.pod_type;
    }

    requestBody.spec = spec;

    if (propsValue.metadata_config) {
      requestBody.metadata_config = propsValue.metadata_config;
    }

    if (propsValue.tags) {
      requestBody.tags = propsValue.tags;
    }

    const response = await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/indexes',
      requestBody
    );

    return response;
  },
});