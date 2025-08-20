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
      description: 'The dimension of the vectors to be inserted in the index',
      required: true,
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
    replicas: Property.Number({
      displayName: 'Replicas',
      description: 'The number of replicas for the index',
      required: false,
      defaultValue: 1,
    }),
    shards: Property.Number({
      displayName: 'Shards',
      description: 'The number of shards for the index',
      required: false,
      defaultValue: 1,
    }),
    pods: Property.Number({
      displayName: 'Pods',
      description: 'The number of pods for the index',
      required: false,
      defaultValue: 1,
    }),
    pod_type: Property.StaticDropdown({
      displayName: 'Pod Type',
      description: 'The type of pod to use for the index',
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
    metadata_config: Property.Object({
      displayName: 'Metadata Configuration',
      description: 'Configuration for metadata indexing (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      name: propsValue.name,
      dimension: propsValue.dimension,
    };

    // Add optional fields if provided
    if (propsValue.metric) {
      requestBody.metric = propsValue.metric;
    }

    const spec: any = {};
    
    if (propsValue.cloud || propsValue.region || propsValue.replicas || propsValue.shards || propsValue.pods || propsValue.pod_type) {
      spec.pod = {};
      
      if (propsValue.cloud) spec.pod.environment = propsValue.cloud;
      if (propsValue.region) spec.pod.region = propsValue.region;
      if (propsValue.replicas) spec.pod.replicas = propsValue.replicas;
      if (propsValue.shards) spec.pod.shards = propsValue.shards;
      if (propsValue.pods) spec.pod.pods = propsValue.pods;
      if (propsValue.pod_type) spec.pod.pod_type = propsValue.pod_type;
      
      requestBody.spec = spec;
    }

    if (propsValue.metadata_config) {
      requestBody.metadata_config = propsValue.metadata_config;
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