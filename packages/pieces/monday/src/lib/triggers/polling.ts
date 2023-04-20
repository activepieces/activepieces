import { DedupeStrategy, Polling } from "@activepieces/pieces-common"

import { getItems, getSubitems } from "../common/data";
import { PollingProps } from "../common/types";

// check for new items in a board
export const itemPolling: Polling<PollingProps> = {
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

// check for new subitems in a board
export const subitemPolling: Polling<PollingProps> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ propsValue }) => {
    const subitems = await getSubitems({
      access_token: propsValue.authentication.access_token,
      board_id: propsValue.board_id
    })
    return subitems.map((item) => ({
      id: item.id,
      data: item,
    }));
  },
}
