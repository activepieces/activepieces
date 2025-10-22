import { createAction } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  apiPost,
  LooseObject,
  checkForErrors,
} from '../common';
import {v4 as uuid } from 'uuid';
import { httpClient } from '@activepieces/pieces-common';

export default createAction({
  auth: couchbaseAuth,
  name: 'create_document',
  displayName: 'Create Document',
  description: 'Creates a document in a Couchbase collection. Returns the id of created document.',
  props: {
    collection: couchbaseCommonProps.collection,
    id: couchbaseCommonProps.identifier(false),
    document: couchbaseCommonProps.document,
  },
  async run(context) {
    const collectionName = context.propsValue.collection || '_default';
    const id = context.propsValue.id || uuid();

    if (!context.propsValue.document) {
      throw new Error("Document value is required.");
    }

    const response = await httpClient.sendRequest(apiPost(
      context.auth,
      "INSERT INTO `" + collectionName + "` ( KEY, VALUE ) VALUES (?, " + JSON.stringify(context.propsValue.document) + ")",
      [id]
    ));

    checkForErrors(response);


    return response.body;
  }
});
