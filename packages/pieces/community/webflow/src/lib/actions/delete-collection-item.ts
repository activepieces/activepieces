import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowDeleteCollectionItem = createAction({
  auth: webflowAuth,
  name: 'delete_collection_item',
  description: 'Delete collection item',
  displayName: 'Delete an item in a collection',
  props: {
    site_id: webflowCommon.sitesDropdown,
    collection_id: webflowCommon.collectionsDropdown,
    collection_item_id: webflowCommon.collectionItemsDropdown,
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const collectionId = configValue.propsValue['collection_id'];
    const collectionItemId = configValue.propsValue['collection_item_id'];

    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://api.webflow.com/collections/${collectionId}/items/${collectionItemId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
