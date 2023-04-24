import { pollingHelper } from "@activepieces/pieces-common"
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'

import { mondayProps } from '../common/props'
import { itemPolling } from "./polling"

export const mondayItemCreatedTrigger = createTrigger({
  name: `monday_item_created`,
  displayName: 'New Item Created',
  description: 'Triggered when a new item is created',
  props: {
    authentication: mondayProps.authentication,
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true)
  },
  sampleData: {
    "id": "22222",
    "name": "Project"
  },
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store, propsValue }) => {
    await pollingHelper.onEnable(itemPolling, {
      store, propsValue: {
        authentication: propsValue.authentication,
        workspace_id: propsValue.workspace_id,
        board_id: propsValue.board_id
      }
    })
  },
  onDisable: async ({ store, propsValue }) => {
    await pollingHelper.onDisable(itemPolling, {
      store, propsValue: {
        authentication: propsValue.authentication,
        workspace_id: propsValue.workspace_id,
        board_id: propsValue.board_id
      }
    })
  },
  run: async ({ store, propsValue }) => {
    return await pollingHelper.poll(itemPolling, {
      store, propsValue: {
        authentication: propsValue.authentication,
        workspace_id: propsValue.workspace_id,
        board_id: propsValue.board_id
      }
    })
  },
  test: async ({ store, propsValue }) => {
    return await pollingHelper.test(itemPolling, {
      store, propsValue: {
        authentication: propsValue.authentication,
        workspace_id: propsValue.workspace_id,
        board_id: propsValue.board_id
      }
    })
  }
})