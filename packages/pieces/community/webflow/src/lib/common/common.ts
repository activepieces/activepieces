import {
  Property,
  OAuth2PropertyValue,
  DynamicPropsValue,
} from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';

export const webflowCommon = {
  baseUrl: 'https://api.webflow.com/',
  collectionFieldProperties: Property.DynamicProperties({
    displayName: 'Items',
    description: 'The values to insert',
    required: true,
    refreshers: ['collection_id'],
    props: async ({ auth, site_id, collection_id }) => {
      if (
        !auth ||
        (site_id ?? '').toString().length === 0 ||
        (collection_id ?? '').toString().length === 0
      ) {
        return {};
      }
      const authentication = auth as OAuth2PropertyValue;
      const values = await webflowCommon.getCollectionProperties(
        site_id,
        collection_id,
        authentication.access_token
      );

      const fieldList = values.body.fields;

      const properties: {
        [key: string]: any;
      } = {};
      for (const key in fieldList) {
        properties[key] = Property.ShortText({
          displayName: fieldList[key].toString(),
          description: fieldList[key].toString(),
          required: false,
          defaultValue: '',
        });
      }
      return properties;
    },
  }),
  sitesDropdown: Property.Dropdown<string>({
    displayName: 'Site',
    description: 'Site Name',
    required: true,
    refreshers: [],
    async options({ auth }) {
      const authProp = auth as OAuth2PropertyValue;

      if (!authProp) {
        return {
          disabled: true,
          placeholder: 'Connect Webflow account',
          options: [],
        };
      }

      const accessToken = authProp.access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: 'https://api.webflow.com/sites',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      };

      const response = await httpClient.sendRequest<
        { _id: string; name: string }[]
      >(request);
      const options = response.body.map((item) => ({
        label: item.name,
        value: item._id,
      }));

      return {
        disabled: false,
        placeholder: 'Select Site',
        options,
      };
    },
  }),
  collectionsDropdown: Property.Dropdown<string>({
    displayName: 'Collection',
    description: 'Collection Name',
    required: true,
    refreshers: ['site_id'],
    async options({ auth, site_id }) {
      const authProp = auth as OAuth2PropertyValue;

      if (!authProp) {
        return {
          disabled: true,
          placeholder: 'Connect Webflow account',
          options: [],
        };
      }

      const accessToken = authProp.access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.webflow.com/sites/${site_id}/collections`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      };

      const response = await httpClient.sendRequest<
        { _id: string; name: string }[]
      >(request);
      const options = response.body.map((item) => ({
        label: item.name,
        value: item._id,
      }));

      return {
        disabled: false,
        placeholder: 'Select Collection',
        options,
      };
    },
  }),
  collectionItemsDropdown: Property.Dropdown<string>({
    displayName: 'Collection Item',
    description: 'Collection Item Name',
    required: true,
    refreshers: ['collection_id'],
    async options({ auth, collection_id }) {
      const authProp = auth as OAuth2PropertyValue;

      if (!authProp) {
        return {
          disabled: true,
          placeholder: 'Connect Webflow account',
          options: [],
        };
      }

      const accessToken = authProp.access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.webflow.com/collections/${collection_id}/items`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      };

      const response = await httpClient.sendRequest<
        { _id: string; name: string }[]
      >(request);
      const options = response.body.map((item) => ({
        label: item.name,
        value: item._id,
      }));

      return {
        disabled: false,
        placeholder: 'Select Collection Item',
        options,
      };
    },
  }),
  ordersDropdown: Property.Dropdown<string>({
    displayName: 'Order',
    description: 'Order Name',
    required: true,
    refreshers: [],
    async options({ auth, site }) {
      const authProp = auth as OAuth2PropertyValue;

      if (!authProp) {
        return {
          disabled: true,
          placeholder: 'Connect Webflow account',
          options: [],
        };
      }

      const accessToken = authProp.access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.webflow.com/sites/${site}/orders`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      };

      const response = await httpClient.sendRequest<
        { _id: string; name: string }[]
      >(request);
      const options = response.body.map((item) => ({
        label: item.name,
        value: item._id,
      }));

      return {
        disabled: false,
        placeholder: 'Select Order',
        options,
      };
    },
  }),
  productsDropdown: Property.Dropdown<string>({
    displayName: 'Product',
    description: 'Product Name',
    required: true,
    refreshers: [],
    async options({ auth, site }) {
      const authProp = auth as OAuth2PropertyValue;

      if (!authProp) {
        return {
          disabled: true,
          placeholder: 'Connect Webflow account',
          options: [],
        };
      }

      const accessToken = authProp.access_token;

      const request: HttpRequest = {
        method: HttpMethod.GET,
        url: `https://api.webflow.com/sites/${site}/products`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      };

      const response = await httpClient.sendRequest<
        { _id: string; name: string }[]
      >(request);
      const options = response.body.map((item) => ({
        label: item.name,
        value: item._id,
      }));

      return {
        disabled: false,
        placeholder: 'Select Product',
        options,
      };
    },
  }),
  getCollectionProperties: async (
    siteId: DynamicPropsValue,
    collectionId: DynamicPropsValue,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.webflow.com/sites/${siteId}/collections/${collectionId}`,
      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };

    const res = await httpClient.sendRequest(request);
    return res;
  },
  subscribeWebhook: async (
    siteId: string,
    tag: string,
    webhookUrl: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `https://api.webflow.com/sites/${siteId}/webhooks`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        triggerType: tag,
        url: webhookUrl,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      queryParams: {},
    };

    const res = await httpClient.sendRequest(request);
    return res;
  },
  unsubscribeWebhook: async (
    siteId: string,
    webhookId: string,
    accessToken: string
  ) => {
    const request: HttpRequest = {
      method: HttpMethod.DELETE,
      url: `https://api.webflow.com/sites/${siteId}/webhooks/${webhookId}`,

      headers: {
        'Content-Type': 'application/json',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
    };
    return await httpClient.sendRequest(request);
  },
};
