


import { createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";

export const mondayCreateAnItem = createAction({
  name: 'create_event',
  displayName: 'Create Event',
  description: 'Create an event inside a project',
  sampleData: {
    "status": 1
  },
  props: {
    authentication: Property.OAuth2({
      displayName: "Authentication",
      description: "OAuth2.0 Authentication",
      authUrl: "https://auth.monday.com/oauth2/authorize",
      tokenUrl: "https://auth.monday.com/oauth2/token",
      required: true,
      scope: ['boards:read', 'boards:write']
    }),
    board_id: Property.ShortText({
      displayName: "Board ID",
      description: "The board's unique identifier.",
      required: true
    }),
    group_id: Property.ShortText({
      displayName: "Group ID",
      description: "The group's unique identifier.",
      required: true
    }),
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
      .entries(itemValues)
      .map(value => `${value[0]}: ${value[1]}`)
      .join(", ")

    const result = await httpClient.sendRequest({
      url: "https://api.monday.com/v2",
      method: HttpMethod.POST,
      headers: {
        'Authorization': authentication.access_token
      },
      body: {
        query: `mutation { create_item (${item}) { id parent_item assets }}`
      }
    })

    if (result.status === 200) {
      return result.body
    }
    return result
  }
})