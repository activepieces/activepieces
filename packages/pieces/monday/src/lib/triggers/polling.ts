import { DedupeStrategy, Polling } from "@activepieces/pieces-common"

import { getItems, getUpdates } from "../common/data";
import { OAuth2PropertyValue } from "@activepieces/pieces-framework";

// check for new items in a board
export const itemPolling: Polling<{
  authentication: OAuth2PropertyValue
  workspace_id: string | undefined
  board_id: string | undefined
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue }) => {
    const items = await getItems({
      access_token: propsValue.authentication.access_token,
      board_id: propsValue.board_id
    })

    return items.map((item) => ({
      id: item.id,
      data: item,
    }))
  },
}

// check for new updates in items of a board
export const updatesPolling: Polling<{
  authentication: OAuth2PropertyValue
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue }) => {
    const updates = await getUpdates({
      access_token: propsValue.authentication.access_token
    })
    return updates.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
}
