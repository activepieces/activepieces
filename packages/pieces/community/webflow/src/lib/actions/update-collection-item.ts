import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowUpdateCollectionItem = createAction({
  auth: webflowAuth,
  name: 'update_collection_item',
  description: 'Update collection item',
  displayName: 'Update an item in a collection',
  props: {
    site_id: webflowCommon.sitesDropdown,
    collection_id: webflowCommon.collectionsDropdown,
    collection_item_id: Property.ShortText({
      displayName: 'Collection Item ID',
      description: 'The ID of the collection item',
      required: true,
    }),
    values: webflowCommon.collectionFieldProperties,
    is_archived: Property.Checkbox({
      displayName: 'Is Archived',
      description: 'Whether the item is archived or not',
      required: false,
    }),
    is_draft: Property.Checkbox({
      displayName: 'Is Draft',
      description: 'Whether the item is a draft or not',
      required: false,
    }),
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const collectionId = configValue.propsValue['collection_id'];
    const collectionItemId = configValue.propsValue['collection_item_id'];
    const isArchived = configValue.propsValue['is_archived'];
    const isDraft = configValue.propsValue['is_draft'];

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `https://api.webflow.com/collections/${collectionId}/items/${collectionItemId}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body: {
        fields: configValue.propsValue['values'],
        isArchived,
        isDraft,
      },
    };

    const res = await httpClient.sendRequest<never>(request);

    return res.body;
  },
});
