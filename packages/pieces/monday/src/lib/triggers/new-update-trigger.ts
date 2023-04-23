import { pollingHelper } from "@activepieces/pieces-common"
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'

import { mondayProps } from '../common/props'
import { updatesPolling } from "./polling"

export const mondayNewUpdatesTrigger = createTrigger({
  name: `monday_new_updates`,
  displayName: 'New Update',
  description: 'Triggered when a new update is created',
  props: {
    authentication: mondayProps.authentication
  },
  sampleData: {
    "id": "22222",
    "name": "Project"
  },
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store, propsValue }) => {
    await pollingHelper.onEnable(updatesPolling, {
      store, propsValue: {
        authentication: propsValue.authentication,
      }
    })
  },
  onDisable: async ({ store, propsValue }) => {
    await pollingHelper.onDisable(updatesPolling, {
      store, propsValue: {
        authentication: propsValue.authentication
      }
    })
  },
  run: async ({ store, propsValue }) => {
    return await pollingHelper.poll(updatesPolling, {
      store, propsValue: {
        authentication: propsValue.authentication
      }
    })
  },
  test: async ({ store, propsValue }) => {
    return await pollingHelper.test(updatesPolling, {
      store, propsValue: {
        authentication: propsValue.authentication
      }
    })
  }
})