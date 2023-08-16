import { HttpMethod } from "@activepieces/pieces-common"
import { createAction, Property } from "@activepieces/pieces-framework"
import { mondayProps } from "../common/props"
import { mondayMakeRequest } from "../common/data"
import { mondayAuth } from "../.."

export const mondayUpdateAnItem = createAction({
  auth: mondayAuth,
  name: 'monday_update_an_item',
  displayName: 'Update Item',
  description: 'Update an item inside a board.',
  sampleData: {
    "data": {
      "change_multiple_column_values": {
        "id": "1175651821"
      }
    },
    "account_id": 16284131
  },
  props: {
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true),
    item_id: mondayProps.item_id(true),
    column_values: Property.Object({
      displayName: "Column Values",
      description: "The column values that you need to update.",
      required: false
    }),
    create_labels_if_missing: Property.Checkbox({
      displayName: "Create Labels if Missing",
      description: "Creates status/dropdown labels if they are missing. This requires permission to change the board structure.",
      defaultValue: false,
      required: false
    })
  },
  async run(context) {
    const { ...itemValues } = context.propsValue

    
    const item: string = Object
    .entries(itemValues.column_values ?? {})
    .map(value => `${value[0]}: "${value[1]}"`)
    .join(', ')
    
    const query = `
      mutation {
        change_multiple_column_values (
          item_id: ${itemValues.item_id},
          board_id: ${itemValues.board_id},
          create_labels_if_missing: ${itemValues.create_labels_if_missing ?? false},
          column_values: { ${item} },
        )
        {
          id
          column_values {
            id
            value
            text
          }
        }
      }
    `

    const result = await mondayMakeRequest(
      context.auth.access_token,
      query,
      HttpMethod.POST
    );

    if (result.status === 200) {
      return result.body
    }
    return result
  }
})
