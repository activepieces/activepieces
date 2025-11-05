import { createAction, Property } from '@activepieces/pieces-framework';
import { apifyAuth } from '../..';
import { createApifyClient, createDropdownOptions, listDatasets } from '../common';

export const getDatasetItems = createAction({
  name: 'getDatasetItems',
  auth: apifyAuth,
  displayName: 'Get Dataset Items',
  description: 'Retrieves items from a dataset',
  props: {
    datasetId: Property.Dropdown({
      required: true,
      refreshers: ['auth'],
      displayName: 'Datasets',
      description: 'Select the dataset to get items from.',
      options: async (props) => {
        return createDropdownOptions(props['auth'], listDatasets);
      }
    }),
    offset: Property.Number({
      required: false,
      displayName: 'Offset',
      description: 'Number of items to skip at the start of the dataset.',
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
    const apifyToken = context.auth.apikey;
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
