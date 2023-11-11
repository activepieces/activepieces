import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';

export const webflowPublishCollectionItem = createAction({
  auth: webflowAuth,
  name: 'publish_collection_item',
  description: 'Publish collection item',
  displayName: 'Publish a Collection Item',
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The ID of the collection',
      required: true,
    }),
    collection_item_id: Property.ShortText({
      displayName: 'Collection Item ID',
      description: 'The ID of the collection item',
      required: true,
    }),
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const collectionId = configValue.propsValue['collection_id'];
    const collectionItemId = configValue.propsValue['collection_item_id'];

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.webflow.com/collections/${collectionId}/items/${collectionItemId}/publish`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
