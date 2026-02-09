import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';

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

        const client = new NetSuiteClient({
          accountId,
          consumerKey,
          consumerSecret,
          tokenId,
          tokenSecret,
        });

        const response = await client.makeRequest<{ items: { id: string; name: string }[] }>({
          method: HttpMethod.GET,
          url: `${client.baseUrl}/services/rest/query/v1/dataset`,
          queryParams: {
            limit: '1000',
          },
        });

        return {
          disabled: false,
          options: response.items.map((item) => ({
            label: item.name,
            value: item.id,
          })),
        };
      },
    }),
  },
  async run(context) {
    const client = new NetSuiteClient(context.auth.props);
    const { datasetId } = context.propsValue;

    return client.makePaginatedRequest({
      method: HttpMethod.GET,
      url: `${client.baseUrl}/services/rest/query/v1/dataset/${datasetId}/result`,
    });
  },
});
