import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netsuiteAuth } from '../..';
import { NetSuiteClient } from '../common/client';

export const executeDataset = createAction({
  name: 'executeDataset',
  auth: netsuiteAuth,
  displayName: 'Execute Dataset',
  description: 'Execute Dataset on NetSuite.',
  audience: 'both',
  aiMetadata: {
    description:
      'Runs a saved NetSuite dataset (workbook query) by its dataset ID and returns all result rows, auto-paginating across them. Use when a predefined dataset already captures the query you need, rather than writing raw SuiteQL. The dataset ID is selected from the datasets available on the connected account. This is a read-only execution and is safe to repeat.',
    idempotent: true,
  },
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

        const client = new NetSuiteClient(auth.props);

        const items = await client.makePaginatedRequest<{
          id: string;
          name: string;
        }>({
          method: HttpMethod.GET,
          url: `${client.baseUrl}/services/rest/query/v1/dataset`,
        });

        return {
          disabled: false,
          options: items.map((item) => ({
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
