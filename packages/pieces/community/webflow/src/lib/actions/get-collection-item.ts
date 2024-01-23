import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';

export const webflowGetCollectionItem = createAction({
  auth: webflowAuth,
  name: 'get_collection_item',
  description: 'Get collection item in a collection by ID',
  displayName: 'Get a Collection Item by ID',
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
      method: HttpMethod.GET,
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
