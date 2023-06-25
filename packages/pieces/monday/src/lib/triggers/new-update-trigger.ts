import { pollingHelper } from "@activepieces/pieces-common"
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'
import { updatesPolling } from "./polling"
import { mondayAuth } from "../.."

export const mondayNewUpdatesTrigger = createTrigger({
  auth: mondayAuth,
  trigger: {
    name: `monday_new_updates`,
    displayName: 'New Update',
    description: 'Triggered when a new update is created',
    props: {
    },
    sampleData: {
      "id": "22222",
      "name": "Project"
    },
    type: TriggerStrategy.POLLING,
    onEnable: async ({ auth, store, propsValue }) => {
      await pollingHelper.onEnable(updatesPolling, {
        auth, store, propsValue
      })
    },
    onDisable: async ({ auth, store, propsValue }) => {
      await pollingHelper.onDisable(updatesPolling, {
        auth, store, propsValue
      })
    },
    run: async ({ auth, store, propsValue }) => {
      return await pollingHelper.poll(updatesPolling, {
        auth, store, propsValue
      })
    },
    test: async ({ auth, store, propsValue }) => {
      return await pollingHelper.test(updatesPolling, {
        auth, store, propsValue
      })
    }
  },
})
