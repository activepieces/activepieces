import { createAction } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  createCouchbaseClient,
  getCollection,
  closeCluster,
  formatGetResult,
  CouchbaseAuthValue,
} from '../common';
import { GetOptions } from 'couchbase';

export default createAction({
  auth: couchbaseAuth,
  name: 'get_document',
  displayName: 'Get Document',
  description: 'Retrieve a document by its ID',
  props: {
    bucket: couchbaseCommonProps.bucket,
    scope: couchbaseCommonProps.scope,
    collection: couchbaseCommonProps.collection,
    documentId: couchbaseCommonProps.documentIdDropdown,
    timeout: couchbaseCommonProps.timeout,
  },
  async run(context) {
    const auth = (context.auth as { props: CouchbaseAuthValue }).props;
    const { bucket, scope, collection, documentId, timeout } = context.propsValue;

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

      const options: GetOptions = {};

      if (timeout && timeout > 0) {
        options.timeout = timeout;
      }

      const result = await coll.get(documentId, options);
      return formatGetResult(result, documentId);
    } finally {
      await closeCluster(cluster);
    }
  },
});
