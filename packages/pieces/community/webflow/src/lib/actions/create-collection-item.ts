import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';
import { webflowCommon } from '../common/common';

export const webflowCreateCollectionItem = createAction({
  auth: webflowAuth,
  name: 'create_collection_item',
  description: 'Create collection item',
  displayName: 'Create an item in a collection',
  props: {
    site_id: webflowCommon.sitesDropdown,
    collection_id: webflowCommon.collectionsDropdown,
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
    const isArchived = configValue.propsValue['is_archived'];
    const isDraft = configValue.propsValue['is_draft'];

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.webflow.com/collections/${collectionId}/items`,
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
