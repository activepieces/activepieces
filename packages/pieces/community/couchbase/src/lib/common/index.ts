import { Property } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  Cluster,
  Collection,
  connect,
  Bucket,
  Scope,
  DurabilityLevel,
  GetResult,
  MutationResult,
} from 'couchbase';


export interface CouchbaseAuthValue {
  connectionString: string;
  username: string;
  password: string;
}


export interface LooseObject {
  [key: string]: unknown;
}


export async function createCouchbaseClient(
  auth: CouchbaseAuthValue
): Promise<Cluster> {
  const isCloudConnection = auth.connectionString.includes('cloud.couchbase.com');
  
  return await connect(auth.connectionString, {
    username: auth.username,
    password: auth.password,
    configProfile: isCloudConnection ? 'wanDevelopment' : undefined,
    timeouts: {
      connectTimeout: 30000,
      kvTimeout: 15000,
      managementTimeout: 60000,
      bootstrapTimeout: 30000,
    },
  });
}


export function getCollection(
  cluster: Cluster,
  bucketName: string,
  scopeName?: string,
  collectionName?: string
): Collection {
  const bucket: Bucket = cluster.bucket(bucketName);
  const scope: Scope = scopeName ? bucket.scope(scopeName) : bucket.defaultScope();
  return collectionName ? scope.collection(collectionName) : scope.collection('_default');
}


export async function closeCluster(cluster: Cluster): Promise<void> {
  try {
    await cluster.close();
  } catch {
    // Ignore close errors
  }
}


export function formatMutationResult(
  result: MutationResult,
  documentId: string
): { id: string; cas: string; success: boolean } {
  return {
    id: documentId,
    cas: result.cas.toString(),
    success: true,
  };
}


export function formatGetResult(
  result: GetResult,
  documentId: string
): { id: string; content: unknown; cas: string } {
  return {
    id: documentId,
    content: result.content,
    cas: result.cas.toString(),
  };
}


export const bucketDropdown = Property.Dropdown({
  displayName: 'Bucket',
  description: 'Select the bucket',
  required: true,
  refreshers: ['auth'],
  auth: couchbaseAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect to Couchbase first',
        options: [],
      };
    }

    const authValue = (auth as { props: CouchbaseAuthValue }).props;
    let cluster: Cluster | null = null;

    try {
      cluster = await createCouchbaseClient(authValue);
      const bucketManager = cluster.buckets();
      const buckets = await bucketManager.getAllBuckets();

      if (!buckets || buckets.length === 0) {
        return {
          disabled: true,
          placeholder: 'No buckets found in cluster',
          options: [],
        };
      }

      return {
        disabled: false,
        options: buckets.map((bucket) => ({
          label: bucket.name,
          value: bucket.name,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        placeholder: `Failed to load buckets: ${errorMessage}`,
        options: [],
      };
    } finally {
      if (cluster) {
        await closeCluster(cluster);
      }
    }
  },
});


export const scopeDropdown = Property.Dropdown({
  displayName: 'Scope',
  description: 'Select the scope (leave empty for default)',
  required: false,
  refreshers: ['auth', 'bucket'],
  auth: couchbaseAuth,
  options: async ({ auth, bucket }) => {
    if (!auth || !bucket) {
      return {
        disabled: true,
        placeholder: 'Select a bucket first',
        options: [],
      };
    }

    const authValue = (auth as { props: CouchbaseAuthValue }).props;
    let cluster: Cluster | null = null;

    try {
      cluster = await createCouchbaseClient(authValue);
      const bucketObj = cluster.bucket(bucket as string);
      const collectionManager = bucketObj.collections();
      const scopes = await collectionManager.getAllScopes();

      if (!scopes || scopes.length === 0) {
        return {
          disabled: false,
          options: [{ label: '_default (Default)', value: '_default' }],
        };
      }

      return {
        disabled: false,
        options: scopes.map((scope) => ({
          label: scope.name === '_default' ? '_default (Default)' : scope.name,
          value: scope.name,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        placeholder: `Failed to load scopes: ${errorMessage}`,
        options: [],
      };
    } finally {
      if (cluster) {
        await closeCluster(cluster);
      }
    }
  },
});


export const collectionDropdown = Property.Dropdown({
  displayName: 'Collection',
  description: 'Select the collection (leave empty for default)',
  required: false,
  refreshers: ['auth', 'bucket', 'scope'],
  auth: couchbaseAuth,
  options: async ({ auth, bucket, scope }) => {
    if (!auth || !bucket) {
      return {
        disabled: true,
        placeholder: 'Select a bucket first',
        options: [],
      };
    }

    const authValue = (auth as { props: CouchbaseAuthValue }).props;
    let cluster: Cluster | null = null;

    try {
      cluster = await createCouchbaseClient(authValue);
      const bucketObj = cluster.bucket(bucket as string);
      const collectionManager = bucketObj.collections();
      const scopes = await collectionManager.getAllScopes();

      const selectedScope = scopes?.find(
        (s) => s.name === (scope || '_default')
      );

      if (!selectedScope || !selectedScope.collections) {
        return {
          disabled: false,
          options: [{ label: '_default (Default)', value: '_default' }],
        };
      }

      return {
        disabled: false,
        options: selectedScope.collections.map((coll) => ({
          label: coll.name === '_default' ? '_default (Default)' : coll.name,
          value: coll.name,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: true,
        placeholder: `Failed to load collections: ${errorMessage}`,
        options: [],
      };
    } finally {
      if (cluster) {
        await closeCluster(cluster);
      }
    }
  },
});


export const documentIdDropdown = Property.Dropdown({
  displayName: 'Document ID',
  description: 'Select an existing document or type a custom ID',
  required: true,
  refreshers: ['auth', 'bucket', 'scope', 'collection'],
  auth: couchbaseAuth,
  options: async ({ auth, bucket, scope, collection }) => {
    if (!auth || !bucket) {
      return {
        disabled: true,
        placeholder: 'Select a bucket first',
        options: [],
      };
    }

    const authValue = (auth as { props: CouchbaseAuthValue }).props;
    let cluster: Cluster | null = null;

    try {
      cluster = await createCouchbaseClient(authValue);
      
      const scopeName = (scope as string) || '_default';
      const collectionName = (collection as string) || '_default';
      const keyspace = `\`${bucket}\`.\`${scopeName}\`.\`${collectionName}\``;
      
      const query = `SELECT META().id AS docId FROM ${keyspace} LIMIT 100`;
      const result = await cluster.query(query);

      if (!result.rows || result.rows.length === 0) {
        return {
          disabled: false,
          placeholder: 'No documents found - type a document ID',
          options: [],
        };
      }

      return {
        disabled: false,
        options: result.rows.map((row: { docId: string }) => ({
          label: row.docId,
          value: row.docId,
        })),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        disabled: false,
        placeholder: `Could not load documents: ${errorMessage}`,
        options: [],
      };
    } finally {
      if (cluster) {
        await closeCluster(cluster);
      }
    }
  },
});


export const durabilityLevelDropdown = Property.StaticDropdown({
  displayName: 'Durability Level',
  description: 'How durable the write should be before returning success',
  required: false,
  options: {
    options: [
      { label: 'None (Fastest)', value: DurabilityLevel.None },
      { label: 'Majority', value: DurabilityLevel.Majority },
      { label: 'Majority and Persist on Master', value: DurabilityLevel.MajorityAndPersistOnMaster },
      { label: 'Persist to Majority (Safest)', value: DurabilityLevel.PersistToMajority },
    ],
  },
});


export const couchbaseCommonProps = {
  bucket: bucketDropdown,
  scope: scopeDropdown,
  collection: collectionDropdown,

  documentIdDropdown: documentIdDropdown,

  documentId: Property.ShortText({
    displayName: 'Document ID',
    description: 'Unique identifier for the document',
    required: true,
  }),

  documentIdOptional: Property.ShortText({
    displayName: 'Document ID',
    description: 'Unique identifier for the document. Leave empty to auto-generate.',
    required: false,
  }),

  document: Property.Json({
    displayName: 'Document',
    description: 'The JSON document to store',
    required: true,
  }),

  expiry: Property.Number({
    displayName: 'Expiry (seconds)',
    description: 'Document expiration time in seconds. Leave empty for no expiry.',
    required: false,
  }),

  durabilityLevel: durabilityLevelDropdown,

  timeout: Property.Number({
    displayName: 'Timeout (ms)',
    description: 'Operation timeout in milliseconds',
    required: false,
    defaultValue: 10000,
  }),

  query: Property.LongText({
    displayName: 'SQL++ Query',
    description: 'SELECT statement with optional positional parameters ($1, $2, etc.). Do not include LIMIT or OFFSET.',
    required: true,
  }),

  arguments: Property.Array({
    displayName: 'Query Arguments',
    description: 'Values for positional parameters ($1, $2, etc.) in the query',
    required: false,
  }),

  limit: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results to return',
    required: false,
  }),

  offset: Property.Number({
    displayName: 'Offset',
    description: 'Number of results to skip',
    required: false,
  }),

  vectorFilters: Property.Array({
    displayName: 'Vector Filters',
    description: 'Filter results by vector similarity (requires vector index)',
    required: false,
    properties: {
      vectorExpr: Property.ShortText({
        displayName: 'Vector Expression',
        description: 'Field path returning a vector (e.g., data.embedding)',
        required: true,
      }),
      targetVector: Property.LongText({
        displayName: 'Target Vector',
        description: 'Array of numbers to compare against (e.g., [0.1, 0.2, ...])',
        required: true,
      }),
      vectorSimilarity: Property.StaticDropdown({
        displayName: 'Similarity Metric',
        required: true,
        defaultValue: 'L2_SQUARED',
        options: {
          options: [
            { label: 'Cosine', value: 'COSINE' },
            { label: 'Dot Product', value: 'DOT' },
            { label: 'Euclidean (L2)', value: 'L2' },
            { label: 'Squared Euclidean', value: 'L2_SQUARED' },
          ],
        },
      }),
      maxDistance: Property.Number({
        displayName: 'Max Distance',
        description: 'Maximum distance threshold',
        required: true,
      }),
      preciseDistance: Property.Checkbox({
        displayName: 'Use Precise Distance',
        description: 'Use VECTOR_DISTANCE instead of APPROX_VECTOR_DISTANCE (slower but more accurate)',
        required: false,
      }),
    },
  }),

  vectorOrder: Property.Array({
    displayName: 'Vector Ordering',
    description: 'Order results by vector similarity (requires vector index)',
    required: false,
    properties: {
      vectorExpr: Property.ShortText({
        displayName: 'Vector Expression',
        description: 'Field path returning a vector (e.g., data.embedding)',
        required: true,
      }),
      targetVector: Property.LongText({
        displayName: 'Target Vector',
        description: 'Array of numbers to compare against (e.g., [0.1, 0.2, ...])',
        required: true,
      }),
      vectorSimilarity: Property.StaticDropdown({
        displayName: 'Similarity Metric',
        required: true,
        defaultValue: 'L2_SQUARED',
        options: {
          options: [
            { label: 'Cosine', value: 'COSINE' },
            { label: 'Dot Product', value: 'DOT' },
            { label: 'Euclidean (L2)', value: 'L2' },
            { label: 'Squared Euclidean', value: 'L2_SQUARED' },
          ],
        },
      }),
      preciseDistance: Property.Checkbox({
        displayName: 'Use Precise Distance',
        description: 'Use VECTOR_DISTANCE instead of APPROX_VECTOR_DISTANCE (slower but more accurate)',
        required: false,
      }),
    },
  }),
};
