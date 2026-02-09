import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { createOAuthHeader } from '../oauth';

const PAGE_SIZE = 1000;

export const executeDataset = createAction({
  name: 'executeDataset',
  auth: netsuiteAuth,
  displayName: 'Execute Dataset',
  description: 'Execute Dataset on NetSuite.',
  props: {
    datasetId: Property.Dropdown({
      auth: netsuiteAuth,
      displayName: 'Dataset',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } =
          auth.props;

        const requestUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/dataset`;
        const httpMethod = HttpMethod.GET;
        const queryParams = {
          limit: String(PAGE_SIZE),
        };

        const authHeader = createOAuthHeader(
          accountId,
          consumerKey,
          consumerSecret,
          tokenId,
          tokenSecret,
          requestUrl,
          httpMethod,
          queryParams
        );

        const response = await httpClient.sendRequest({
          method: httpMethod,
          url: requestUrl,
          headers: {
            Authorization: authHeader,
            prefer: 'transient',
            Cookie: 'NS_ROUTING_VERSION=LAGGING',
          },
          queryParams: queryParams,
        });

        return {
          disabled: false,
          options: response.body.items.map((item: any) => {
            return {
              label: item.name,
              value: item.id,
            };
          }),
        };
      },
    }),
  },
  async run(context) {
    const { accountId, consumerKey, consumerSecret, tokenId, tokenSecret } =
      context.auth.props;

    const { datasetId } = context.propsValue;

    const results = [];
    let pageOffset = 0;
    let hasMore = true;

    const requestUrl = `https://${accountId}.suitetalk.api.netsuite.com/services/rest/query/v1/dataset/${datasetId}/result`;
    const httpMethod = HttpMethod.GET;

    // paginate results: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_156414087576.html
    while (hasMore) {
      const queryParams = {
        limit: String(PAGE_SIZE),
        offset: String(pageOffset),
      };

      const authHeader = createOAuthHeader(
        accountId,
        consumerKey,
        consumerSecret,
        tokenId,
        tokenSecret,
        requestUrl,
        httpMethod,
        queryParams
      );

      const response = await httpClient.sendRequest({
        method: httpMethod,
        url: requestUrl,
        headers: {
          Authorization: authHeader,
          prefer: 'transient',
          Cookie: 'NS_ROUTING_VERSION=LAGGING',
        },
        queryParams: queryParams,
      });

      results.push(...(response.body?.items || []));

      hasMore = response.body?.hasMore || false;
      pageOffset += PAGE_SIZE;
    }

    return results;
  },
});
