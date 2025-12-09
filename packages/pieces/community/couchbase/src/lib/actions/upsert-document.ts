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
import { randomUUID } from 'crypto';
import { UpsertOptions, DurabilityLevel } from 'couchbase';

export default createAction({
  auth: couchbaseAuth,
  name: 'upsert_document',
  displayName: 'Upsert Document',
  description: 'Create or update a document. Creates if it doesn\'t exist, updates if it does.',
  props: {
    bucket: couchbaseCommonProps.bucket,
    scope: couchbaseCommonProps.scope,
    collection: couchbaseCommonProps.collection,
    documentId: couchbaseCommonProps.documentIdOptional,
    document: couchbaseCommonProps.document,
    expiry: couchbaseCommonProps.expiry,
    durabilityLevel: couchbaseCommonProps.durabilityLevel,
    timeout: couchbaseCommonProps.timeout,
  },
  async run(context) {
    const auth = (context.auth as { props: CouchbaseAuthValue }).props;
    const { bucket, scope, collection, documentId, document, expiry, durabilityLevel, timeout } = context.propsValue;

    if (!bucket) {
      throw new Error('Bucket is required');
    }

    if (!document) {
      throw new Error('Document is required');
    }

    const docId = documentId || randomUUID();
    const cluster = await createCouchbaseClient(auth);

    try {
      const coll = getCollection(
        cluster,
        bucket,
        scope || undefined,
        collection || undefined
      );

      const options: UpsertOptions = {};

      if (expiry && expiry > 0) {
        options.expiry = expiry;
      }

      if (durabilityLevel !== undefined && durabilityLevel !== null) {
        options.durabilityLevel = durabilityLevel as DurabilityLevel;
      }

      if (timeout && timeout > 0) {
        options.timeout = timeout;
      }

      const result = await coll.upsert(docId, document, options);
      return formatMutationResult(result, docId);
    } finally {
      await closeCluster(cluster);
    }
  },
});
