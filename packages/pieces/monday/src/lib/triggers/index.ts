import { mondayRegisterTrigger } from "./register";

export const mondayTriggers = [
  {
    name: 'create_item',
    event: 'create_item',
    displayName: 'Item Created',
    description: 'Triggered on `create_item`',
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
    event: 'create_subitem',
    displayName: 'Subitem Created',
    description: 'Triggered on `create_subitem`',
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
].map(trigger => mondayRegisterTrigger(trigger))
