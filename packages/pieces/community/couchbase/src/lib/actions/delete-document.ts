import { createAction } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  apiPost,
  scopeId,
  LooseObject,
  checkForErrors,
} from '../common';
import { httpClient } from '@activepieces/pieces-common';

export default createAction({
  auth: couchbaseAuth,
  name: 'delete_document',
  displayName: 'Delete Document By Key',
  description: 'Delete a document in collection using key as parameter',
  props: {
    collection: couchbaseCommonProps.collection,
    id: couchbaseCommonProps.identifier(true),
  },
  async run(context) {
    const collectionName = context.propsValue.collection || '_default';

    if (!context.propsValue.id) {
      throw new Error('Document identifier is required');
    }

    const response = await httpClient.sendRequest(apiPost(
      context.auth,
      "DELETE FROM `" + collectionName + "` USE KEYS ?",
      [context.propsValue.id]
    ));

    checkForErrors(response);
    return response.body;
  }
});
