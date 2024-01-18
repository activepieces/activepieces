import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { webflowAuth } from '../..';

export const webflowFindCollectionItem = createAction({
  auth: webflowAuth,
  name: 'find_collection_item',
  description: 'Find collection item in a collection by field',
  displayName: 'Find a Collection Item by Field',
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The ID of the collection',
      required: true,
    }),
    field_name: Property.ShortText({
      displayName: 'Field Name',
      description: 'The name of the field to search by',
      required: true,
    }),
    field_value: Property.ShortText({
      displayName: 'Field Value',
      description: 'The value of the field to search for',
      required: true,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description: 'The maximum number of results to return',
      required: false,
    }),
  },

  async run(configValue) {
    const accessToken = configValue.auth['access_token'];
    const collectionId = configValue.propsValue['collection_id'];
    const fieldName = configValue.propsValue['field_name'];
    const fieldValue = configValue.propsValue['field_value'];
    const maxResults = configValue.propsValue['max_results'];

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.webflow.com/collections/${collectionId}/items`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    try {
      const res = await httpClient.sendRequest(request);
      if (res.status !== 200) {
        throw new Error('Failed to fetch collection items');
      }

      const items = res.body.items;
      const matches = items
        .filter((item: any) => {
          return item.fields[fieldName] === fieldValue;
        })
        .slice(0, maxResults);

      return { success: true, result: matches };
    } catch (err) {
      return { success: false, message: err };
    }
  },
});
