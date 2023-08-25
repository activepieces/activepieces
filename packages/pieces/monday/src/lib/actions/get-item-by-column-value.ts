import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { mondayProps } from '../common/props';
import { mondayMakeRequest } from '../common/data';
import { mondayAuth } from '../..';

export const mondayGetItemByColumnValues = createAction({
  auth: mondayAuth,
  name: 'monday_get_item-by-col-val',
  displayName: 'Get Item by Column Values',
  description: 'Get item by providing column value.',
  props: {
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true),
    column_id: Property.ShortText({
      displayName: 'Column Id',
      description: "Value of an item's column",
      required: true,
    }),
    column_values: Property.Array({
      displayName: 'Column Values',
      description: 'Column values to search',
      required: true,
    }),
  },
  async run(context) {
    const { ...itemValues } = context.propsValue;

    const item = itemValues.column_values?.map((value) => `"${value}"`);

    const query = `
    query {
      items_by_column_values(
        board_id: ${itemValues.board_id},
        column_id: "${itemValues.column_id}",
        column_value: ${item}
      ) {
        id,
        name 
      }
    }
    `;

    const result = await mondayMakeRequest(
      context.auth.access_token,
      query,
      HttpMethod.GET
    );
    
    if (result.status === 200) {
      return result.body?.data?.items_by_column_values;
    }
    return result;
  },
});
