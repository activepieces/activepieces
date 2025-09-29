import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const createIndex = createAction({
  auth: pineconeAuth,
  name: 'create_index',
  displayName: 'Create Index',
  description: 'Creates a new Pinecone index with custom settings.',
  props: {
    name: Property.ShortText({
      displayName: 'Index Name',
      description:
        'You must pass a non-empty string for name in order to create an index',
      required: true
    }),
    dimension: Property.Number({
      displayName: 'Dimension',
      description:
        'You must pass a positive integer for dimension in order to create an index. For dense indexes, this is required.',
      required: true
    }),
    indexType: Property.StaticDropdown({
      displayName: 'Index Type',
      description: 'Choose between serverless or pod-based index deployment',
      required: true,
      options: {
        options: [
          { label: 'Serverless', value: 'serverless' },
          { label: 'Pod-based', value: 'pod' }
        ]
      },
      defaultValue: 'serverless'
    }),
    cloud: Property.StaticDropdown({
      displayName: 'Cloud Provider',
      description:
        'The public cloud where you would like your index hosted (for serverless)',
      required: false,
      options: {
        options: [
          { label: 'AWS', value: 'aws' },
          { label: 'GCP', value: 'gcp' },
          { label: 'Azure', value: 'azure' }
        ]
      },
      defaultValue: 'aws'
    }),
    region: Property.ShortText({
      displayName: 'Region',
      description:
        'The region where you would like your index to be created (for serverless)',
      required: false,
      defaultValue: 'us-west-2'
    }),
    environment: Property.ShortText({
      displayName: 'Environment',
      description:
        'The environment where the index is hosted (for pod-based indexes)',
      required: false
    }),
    podType: Property.StaticDropdown({
      displayName: 'Pod Type',
      description: 'The type of pod to use',
      required: false,
      options: {
        options: [
          { label: 's1.x1', value: 's1.x1' },
          { label: 's1.x2', value: 's1.x2' },
          { label: 's1.x4', value: 's1.x4' },
          { label: 's1.x8', value: 's1.x8' },
          { label: 'p1.x1', value: 'p1.x1' },
          { label: 'p1.x2', value: 'p1.x2' },
          { label: 'p1.x4', value: 'p1.x4' },
          { label: 'p1.x8', value: 'p1.x8' },
          { label: 'p2.x1', value: 'p2.x1' },
          { label: 'p2.x2', value: 'p2.x2' },
          { label: 'p2.x4', value: 'p2.x4' },
          { label: 'p2.x8', value: 'p2.x8' }
        ]
      },
      defaultValue: 'p1.x1'
    }),
    replicas: Property.Number({
      displayName: 'Replicas',
      description:
        'The number of replicas. Replicas duplicate your index for higher availability and throughput.',
      required: false
    }),
    shards: Property.Number({
      displayName: 'Shards',
      description:
        'The number of shards. Shards split your data across multiple pods.',
      required: false
    }),
    pods: Property.Number({
      displayName: 'Pods',
      description:
        'The number of pods to be used in the index. This should be equal to shards x replicas.',
      required: false
    }),
    metric: Property.StaticDropdown({
      displayName: 'Metric',
      description:
        'The distance metric to use. Defaults to cosine for dense indexes, dotproduct for sparse indexes.',
      required: false,
      options: {
        options: [
          { label: 'Cosine', value: 'cosine' },
          { label: 'Euclidean', value: 'euclidean' },
          { label: 'Dot Product', value: 'dotproduct' }
        ]
      }
    }),
    vectorType: Property.StaticDropdown({
      displayName: 'Vector Type',
      description:
        'The type of vectors to store. Dense is default for most use cases.',
      required: false,
      options: {
        options: [
          { label: 'Dense', value: 'dense' },
          { label: 'Sparse', value: 'sparse' }
        ]
      },
      defaultValue: 'dense'
    }),
    deletionProtection: Property.Checkbox({
      displayName: 'Deletion Protection',
      description: 'Enable deletion protection for the index',
      required: false,
      defaultValue: false
    }),
    waitUntilReady: Property.Checkbox({
      displayName: 'Wait Until Ready',
      description:
        'Wait until the index is ready to receive data before completing',
      required: false,
      defaultValue: false
    }),
    suppressConflicts: Property.Checkbox({
      displayName: 'Suppress Conflicts',
      description:
        'Do not throw if you attempt to create an index that already exists',
      required: false,
      defaultValue: false
    }),
    tags: Property.Json({
      displayName: 'Tags',
      description:
        'Optional tags for the index (e.g., {"team": "data-science"})',
      required: false
    }),
    sourceCollection: Property.ShortText({
      displayName: 'Source Collection',
      description:
        'The name of the collection to be used as the source for the index',
      required: false
    })
  },
  async run(context) {
    const {
      name,
      dimension,
      indexType,
      cloud,
      region,
      environment,
      podType,
      replicas,
      shards,
      pods,
      metric,
      vectorType,
      deletionProtection,
      waitUntilReady,
      suppressConflicts,
      tags,
      sourceCollection
    } = context.propsValue;

    if (!name) {
      throw new Error(
        'You must pass a non-empty string for `name` in order to create an index.'
      );
    }

    if (dimension && dimension <= 0) {
      throw new Error(
        'You must pass a positive integer for `dimension` in order to create an index.'
      );
    }

    const vType = vectorType?.toLowerCase() || 'dense';
    if (vType === 'sparse') {
      if (dimension && dimension > 0) {
        throw new Error('Sparse indexes cannot have a `dimension`.');
      }
      if (metric && metric !== 'dotproduct') {
        throw new Error('Sparse indexes must have a `metric` of `dotproduct`.');
      }
    } else if (vType === 'dense') {
      if (!dimension || dimension <= 0) {
        throw new Error(
          'You must pass a positive `dimension` when creating a dense index.'
        );
      }
    }

    const pc = createPineconeClientFromAuth(context.auth);

    try {
      let spec: any;

      if (indexType === 'serverless') {
        if (!cloud) {
          throw new Error(
            'You must pass a `cloud` for the serverless `spec` object in order to create an index.'
          );
        }
        if (!region) {
          throw new Error(
            'You must pass a `region` for the serverless `spec` object in order to create an index.'
          );
        }

        spec = {
          serverless: {
            cloud: cloud,
            region: region,
            ...(sourceCollection && { sourceCollection })
          }
        };
      } else if (indexType === 'pod') {
        if (!environment) {
          throw new Error(
            'You must pass an `environment` for the pod `spec` object in order to create an index.'
          );
        }
        if (!podType) {
          throw new Error(
            'You must pass a `podType` for the pod `spec` object in order to create an index.'
          );
        }

        spec = {
          pod: {
            environment: environment,
            podType: podType,
            ...(replicas && { replicas }),
            ...(shards && { shards }),
            ...(pods && { pods }),
            ...(sourceCollection && { sourceCollection })
          }
        };
      }

      const createIndexOptions: any = {
        name: name,
        dimension: dimension,
        spec: spec,
        ...(metric && { metric }),
        ...(vectorType && { vector_type: vectorType }),
        ...(deletionProtection !== undefined && { 
          deletionProtection: deletionProtection ? 'enabled' : 'disabled' 
        }),
        ...(tags && { tags }),
        waitUntilReady: waitUntilReady || false,
        suppressConflicts: suppressConflicts || false
      };

      if (!createIndexOptions.metric) {
        if (vType === 'sparse') {
          createIndexOptions.metric = 'dotproduct';
        } else {
          createIndexOptions.metric = 'cosine';
        }
      }

      const response = await pc.createIndex(createIndexOptions);

      return {
        success: true,
        indexName: name,
        dimension: dimension,
        indexType: indexType,
        spec: spec,
        metric: createIndexOptions.metric,
        vectorType: vType,
        ...(tags && { tags }),
        message: 'Index created successfully',
        ...(response && { response })
      };
    } catch (caught) {
      console.log('Failed to create index.', caught);
      return caught;
    }
  }
});
