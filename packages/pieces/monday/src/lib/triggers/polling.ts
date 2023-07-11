import { DedupeStrategy, Polling } from "@activepieces/pieces-common"

import { getItems, getUpdates } from "../common/data";
import { OAuth2PropertyValue, PiecePropertyMap, StaticPropsValue } from "@activepieces/pieces-framework";

// check for new items in a board
export const itemPolling: Polling<OAuth2PropertyValue, {
  workspace_id: string | undefined
  board_id: string | undefined
}> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, propsValue }) => {
    const items = await getItems({
      access_token: auth.access_token,
      board_id: propsValue.board_id
    })

    return items.map((item) => ({
      id: item.id,
      data: item,
    }))
  },
}

// check for new updates in items of a board
export const updatesPolling: Polling<OAuth2PropertyValue, StaticPropsValue<PiecePropertyMap>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const updates = await getUpdates({
      access_token: auth.access_token
    })
    return updates.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
}
