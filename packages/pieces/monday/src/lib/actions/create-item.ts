import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import { MondayColumnMapping, generateColumnIdTypeMap } from '../common/helper';

export const mondayCreateAnItem = createAction({
  auth: mondayAuth,
  name: 'monday_create_an_item',
  displayName: 'Create Item',
  description: 'Create a new item inside a board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    group_id: mondayCommon.group_id(false),
    item_name: Property.ShortText({
      displayName: 'Item Name',
      description: 'Item Name',
      required: true,
    }),
    column_values: mondayCommon.columnValues,
    create_labels_if_missing: Property.Checkbox({
      displayName: 'Create Labels if Missing',
      description:
        'Creates status/dropdown labels if they are missing. This requires permission to change the board structure.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const { board_id, item_name, create_labels_if_missing } =
      context.propsValue;
    const group_id = context.propsValue.group_id!;
    const columnValuesInput = context.propsValue.column_values;
    const mondayColumnValues: DynamicPropsValue = {};

    console.log('aCTION');
    console.log(columnValuesInput);
    Object.keys(columnValuesInput).forEach((key) => {
      console.log(
        `key : ${key}   value : ${
          columnValuesInput[key]
        }  type : ${typeof columnValuesInput[key]}`
      );
    });

    const client = makeClient(context.auth as string);
    const res = await client.listBoardColumns({
      boardId: board_id as unknown as string,
    });
    const columns = res.data.boards[0]?.columns;
    const columnIdTypeMap = generateColumnIdTypeMap(columns);
    Object.keys(columnValuesInput).forEach((key) => {
      if (columnValuesInput[key] !== '') {
        const columnType: string = columnIdTypeMap[key];
        mondayColumnValues[key] = MondayColumnMapping[
          columnType
        ].buildMondayType(columnValuesInput[key]);
      }
    });
    console.log('FORMATEED VALUES');
    console.log(mondayColumnValues);
    Object.keys(mondayColumnValues).forEach((key) => {
      console.log(
        `key : ${key}   value : ${
          mondayColumnValues[key]
        }  type : ${typeof mondayColumnValues[key]}`
      );
    });
    return await client.createItem({
      itemName: item_name,
      boardId: board_id,
      groupId: group_id,
      columnValues: JSON.stringify(mondayColumnValues),
      craeteLables: create_labels_if_missing ?? false,
    });
    // const query = `
    //   mutation {
    //     create_item (
    //       item_name: "${itemValues.item_name}",
    //       board_id: ${itemValues.board_id},
    //       ${itemValues.group_id ? `group_id: ${itemValues.group_id},` : ``}
    //       create_labels_if_missing: ${
    //         itemValues.create_labels_if_missing ?? false
    //       },
    //       ${
    //         itemValues.column_values
    //           ? `column_values: " ${JSON.stringify(
    //               itemValues?.column_values
    //             ).replace(/"/g, '\\"')}",`
    //           : ``
    //       }
    //     )
    //     { id }
    //   }
    // `;
    // const result = await mondayMakeRequest(
    //   context.auth.access_token,
    //   query,
    //   HttpMethod.POST
    // );
    // if (result.status === 200) {
    //   return result.body;
    // }
    // return result;
  },
});
