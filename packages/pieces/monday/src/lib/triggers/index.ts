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
      "event": {
        "userId": 9603417,
        "originalTriggerUuid": null,
        "boardId": 1771812698,
        "pulseId": 1772099344,
        "pulseName": "Create_item webhook",
        "groupId": "topics",
        "groupName": "Group Title",
        "groupColor": "#579bfc",
        "isTopGroup": true,
        "columnValues": {},
        "app": "monday",
        "type": "create_pulse",
        "triggerTime": "2021-10-11T09:07:28.210Z",
        "subscriptionId": 73759690,
        "triggerUuid": "b5ed2e17c530f43668de130142445cba"
      }
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
      "event": {
        "userId": 9603417,
        "originalTriggerUuid": null,
        "boardId": 1772135370,
        "pulseId": 1772139123,
        "itemId": 1772139123,
        "pulseName": "sub-item",
        "groupId": "topics",
        "groupName": "Subitems",
        "groupColor": "#579bfc",
        "isTopGroup": true,
        "columnValues": {},
        "app": "monday",
        "type": "create_pulse",
        "triggerTime": "2021-10-11T09:24:51.835Z",
        "subscriptionId": 73761697,
        "triggerUuid": "5c28578c66653a87b00a80aa4f7a6ce3",
        "parentItemId": "1771812716",
        "parentItemBoardId": "1771812698"
      }
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
