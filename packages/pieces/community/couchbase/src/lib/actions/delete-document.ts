import { createAction } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  createCouchbaseClient,
  getCollection,
  closeCluster,
  formatMutationResult,
  CouchbaseAuthValue,
} from '../common';
import { RemoveOptions, DurabilityLevel } from 'couchbase';

export default createAction({
  auth: couchbaseAuth,
  name: 'delete_document',
  displayName: 'Delete Document',
  description: 'Remove a document by its ID',
  props: {
    bucket: couchbaseCommonProps.bucket,
    scope: couchbaseCommonProps.scope,
    collection: couchbaseCommonProps.collection,
    documentId: couchbaseCommonProps.documentIdDropdown,
    durabilityLevel: couchbaseCommonProps.durabilityLevel,
    timeout: couchbaseCommonProps.timeout,
  },
  async run(context) {
    const auth = (context.auth as { props: CouchbaseAuthValue }).props;
    const { bucket, scope, collection, documentId, durabilityLevel, timeout } = context.propsValue;

    if (!bucket) {
      throw new Error('Bucket is required');
    }

    if (!documentId) {
      throw new Error('Document ID is required');
    }

    const cluster = await createCouchbaseClient(auth);

    try {
      const coll = getCollection(
        cluster,
        bucket,
        scope || undefined,
        collection || undefined
      );

      const options: RemoveOptions = {};

      if (durabilityLevel !== undefined && durabilityLevel !== null) {
        options.durabilityLevel = durabilityLevel as DurabilityLevel;
      }

      if (timeout && timeout > 0) {
        options.timeout = timeout;
      }

      const result = await coll.remove(documentId, options);
      return formatMutationResult(result, documentId);
    } finally {
      await closeCluster(cluster);
    }
  },
});
