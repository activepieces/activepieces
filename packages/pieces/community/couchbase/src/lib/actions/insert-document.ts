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
import { InsertOptions, DurabilityLevel } from 'couchbase';

export default createAction({
  auth: couchbaseAuth,
  name: 'insert_document',
  displayName: 'Insert Document',
  description: 'Create a new document. Fails if document already exists.',
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

      const options: InsertOptions = {};

      if (expiry && expiry > 0) {
        options.expiry = expiry;
      }

      if (durabilityLevel !== undefined && durabilityLevel !== null) {
        options.durabilityLevel = durabilityLevel as DurabilityLevel;
      }

      if (timeout && timeout > 0) {
        options.timeout = timeout;
      }

      const result = await coll.insert(docId, document, options);
      return formatMutationResult(result, docId);
    } finally {
      await closeCluster(cluster);
    }
  },
});
