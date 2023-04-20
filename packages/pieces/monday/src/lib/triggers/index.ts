import { pollingHelper } from "@activepieces/pieces-common"
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'

import { mondayProps } from '../common/props'
import { itemPolling, subitemPolling } from "./polling"

export const mondayTriggers = [
  {
    name: 'create_item',
    displayName: 'New Item Created',
    description: 'Triggered when a new item is created',
    polling: itemPolling,
    sampleData: {
     "id": "22222",
     "name": "Project"
    }
  },
  {
    name: 'create_subitem',
    displayName: 'New Subitem Created',
    description: 'Triggered when a subitem is created',
    polling: subitemPolling,
    props: {
      item_id: mondayProps.item_id(false)
    },
    sampleData: {
      "id": "22222",
      "name": "Project"
    }
  }
].map(trigger => createTrigger({
  name: `monday_${trigger.name}`,
  displayName: trigger.displayName,
  description: trigger.description,
  props: {
    authentication: mondayProps.authentication,
    workspace_id: mondayProps.workspace_id(true),
    board_id: mondayProps.board_id(true),
    ...(trigger.props ?? {})
  },
  sampleData: trigger.sampleData,
  type: TriggerStrategy.POLLING,
  onEnable: async ({ store, propsValue }) => {
    await pollingHelper.onEnable(trigger.polling, { store, propsValue: {
      authentication: propsValue.authentication,
      workspace_id: propsValue.workspace_id,
      board_id: propsValue.board_id
    }})
  },
  onDisable: async ({ store, propsValue }) => {
    await pollingHelper.onDisable(trigger.polling, { store, propsValue: {
      authentication: propsValue.authentication,
      workspace_id: propsValue.workspace_id,
      board_id: propsValue.board_id
    }})
  },
  run: async ({ store, propsValue }) => {
    return await pollingHelper.poll(trigger.polling, { store, propsValue: {
      authentication: propsValue.authentication,
      workspace_id: propsValue.workspace_id,
      board_id: propsValue.board_id
    }})
  },
  test: async ({ store, propsValue }) => {
    return await pollingHelper.test(trigger.polling, { store, propsValue: {
      authentication: propsValue.authentication,
      workspace_id: propsValue.workspace_id,
      board_id: propsValue.board_id
    }})
  }
}))
