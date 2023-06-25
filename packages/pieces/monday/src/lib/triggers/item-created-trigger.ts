import { pollingHelper } from "@activepieces/pieces-common"
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'

import { mondayProps } from '../common/props'
import { itemPolling } from "./polling"
import { mondayAuth } from "../.."

export const mondayItemCreatedTrigger = createTrigger({
  auth: mondayAuth,
  trigger: {
    name: `monday_item_created`,
    displayName: 'New Item Created',
    description: 'Triggered when a new item is created',
    props: {
      workspace_id: mondayProps.workspace_id(true),
      board_id: mondayProps.board_id(true)
    },
    sampleData: {
      "id": "22222",
      "name": "Project"
    },
    type: TriggerStrategy.POLLING,
    onEnable: async ({ auth, store, propsValue }) => {
      await pollingHelper.onEnable(itemPolling, {
        auth, store, propsValue
      })
    },
    onDisable: async ({ auth, store, propsValue }) => {
      await pollingHelper.onDisable(itemPolling, {
        auth, store, propsValue
      })
    },
    run: async ({ auth, store, propsValue }) => {
      return await pollingHelper.poll(itemPolling, {
        auth, store, propsValue
      })
    },
    test: async ({ auth, store, propsValue }) => {
      return await pollingHelper.test(itemPolling, {
        auth, store, propsValue
      })
    }
  }
})
