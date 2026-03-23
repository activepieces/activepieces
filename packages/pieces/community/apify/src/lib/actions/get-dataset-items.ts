import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient, createDropdownOptions, listDatasets } from '../common';

export const getDatasetItems = createAction({
  name: 'getDatasetItems',
  auth: apifyAuth,
  displayName: 'Get Dataset Items',
  description: 'Retrieves items from a dataset.',
  props: {
    datasetId: Property.Dropdown({
      auth: apifyAuth,
      required: true,
      refreshers: ['auth'],
      displayName: 'Dataset',
      description: 'Select the dataset to get items from.',
      options: async (props) => {
        return createDropdownOptions(props['auth'], listDatasets);
      }
    }),
    offset: Property.Number({
      required: false,
      displayName: 'Offset',
      description: 'Number of items that should be skipped at the start. The default value is `0`.',
      defaultValue: 0
    }),
    limit: Property.Number({
      required: false,
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      defaultValue: 50
    })
  },
  async run(context) {
    const apifyToken = context.auth.props.apikey;
    const { datasetId, offset, limit } = context.propsValue;

    const client = createApifyClient(apifyToken);

    const response = await client.dataset(datasetId).listItems({
      limit,
      offset
    });

    return {
      items: response.items,
      count: response.count,
      datasetId,
    };
  }
});
