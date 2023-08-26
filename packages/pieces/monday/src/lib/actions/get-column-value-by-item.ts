import { HttpMethod } from "@activepieces/pieces-common"
import { Property, createAction } from "@activepieces/pieces-framework"
import { mondayProps } from "../common/props"
import { mondayMakeRequest } from "../common/data"
import { mondayAuth } from "../.."

export const mondayGetItemColumnValues = createAction({
  auth: mondayAuth,
  name: 'monday_get_item-col-val',
  displayName: 'Get Column Values',
  description: 'Get Column values by providing item id.',
  props: {
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true),
    item_id: Property.ShortText({
      displayName: 'Item Id',
      description: "Value of an item's id",
      required: true,
    }),
  },
  async run(context) {
    const { ...itemValues } = context.propsValue
    
    const query = `
      query {
        items (
          ids: ${[itemValues.item_id]},
        )
        { 
          id
          name
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
      HttpMethod.GET
    )

    if (result.status === 200) {
      return result.body?.data?.items?.[0]
    }
    return result
  }
})
