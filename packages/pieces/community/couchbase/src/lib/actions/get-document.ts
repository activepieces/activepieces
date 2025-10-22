import { createAction } from '@activepieces/pieces-framework';
import { couchbaseAuth } from '../..';
import {
  couchbaseCommonProps,
  apiGet,
  LooseObject,
  checkForErrors,
} from '../common';
import { httpClient } from '@activepieces/pieces-common';

export default createAction({
  auth: couchbaseAuth,
  name: 'get_document',
  displayName: 'Get Document By Key',
  description: 'Find a document in collection using key as parameter',
  props: {
    collection: couchbaseCommonProps.collection,
    id: couchbaseCommonProps.identifier(true),
  },
  async run(context) {
    const collectionName = context.propsValue.collection || '_default';

    if (!context.propsValue.id) {
      throw new Error('Document identifier is required');
    }

    const response = await httpClient.sendRequest(apiGet(
      context.auth,
      "SELECT RAW data FROM `" + collectionName + "` data USE KEYS $1",
      [context.propsValue.id]
    ));

    checkForErrors(response);

    console.debug("Response:", response.body);
    return response.body;
  }
});
