import { HttpMethod } from "@activepieces/pieces-common"
import { createAction, Property } from "@activepieces/pieces-framework"
import { mondayProps } from "../common/props"
import { mondayMakeRequest } from "../common/data"

export const mondayCreateAnItem = createAction({
  name: 'monday_create_an_item',
  displayName: 'Create Item',
  description: 'Create a new item inside a board.',
  sampleData: {
    "data": {
      "create_item": {
        "id": "1175651821"
      }
    },
    "account_id": 16284131
  },
  props: {
    authentication: mondayProps.authentication,
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true),
    group_id: mondayProps.group_id(false),
    item_name: Property.ShortText({
      displayName: "Item Name",
      description: "Item Name",
      required: true
    }),
    column_values: Property.Object({
      displayName: "Column Values",
      description: "The column values of the new item.",
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
    const { authentication, ...itemValues } = context.propsValue
    
    const item: string = Object
      .entries(itemValues.column_values ?? {})
      .map(value => `${value[0]}: "${value[1]}"`)
      .join(', ')

    const query = `
      mutation { 
        create_item (
          item_name: "${itemValues.item_name}",
          board_id: ${itemValues.board_id},
          ${itemValues.group_id ? `group_id: ${itemValues.group_id},` : ``}
          create_labels_if_missing: ${itemValues.create_labels_if_missing ?? false},
          ${itemValues.column_values ? `column_values: { ${item} },` : ``}
        ) 
        { id }
      }
    `

    const result = await mondayMakeRequest(
      authentication.access_token,
      query,
      HttpMethod.POST
    )

    if (result.status === 200) {
      return result.body
    }
    return result
  }
})