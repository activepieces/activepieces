import { ClickupEventType } from "../common/models"
import { clickupRegisterTrigger } from "./register-trigger"

const sampleTask = {
  "id": "string",
  "custom_id": "string",
  "name": "string",
  "text_content": "string",
  "description": "string",
  "status": {
    "status": "in progress",
    "color": "#d3d3d3",
    "orderindex": 1,
    "type": "custom"
  },
  "orderindex": "string",
  "date_created": "string",
  "date_updated": "string",
  "date_closed": "string",
  "creator": {
    "id": 183,
    "username": "John Doe",
    "color": "#827718",
    "profilePicture": "https://attachments-public.clickup.com/profilePictures/183_abc.jpg"
  },
  "assignees": [
    "string"
  ],
  "checklists": [
    "string"
  ],
  "tags": [
    "string"
  ],
  "parent": "string",
  "priority": "string",
  "due_date": "string",
  "start_date": "string",
  "time_estimate": "string",
  "time_spent": "string",
  "custom_fields": [
    {
      "id": "string",
      "name": "string",
      "type": "string",
      "type_config": {},
      "date_created": "string",
      "hide_from_guests": true,
      "value": {
        "id": 183,
        "username": "John Doe",
        "email": "john@example.com",
        "color": "#7b68ee",
        "initials": "JD",
        "profilePicture": null
      },
      "required": true
    }
  ],
  "list": {
    "id": "123"
  },
  "folder": {
    "id": "456"
  },
  "space": {
    "id": "789"
  },
  "url": "string"
}

export const clickupTriggers = [
  {
    name: "task_created",
    eventType: ClickupEventType.TASK_CREATED,
    displayName: 'Task created',
    description: 'Triggered when a new task is created.',
    sampleData: {
      event: 'taskCreated',
      history_items: [
        {
          id: '1394258655167106175',
          type: 1,
          date: '1378109721053',
          field: 'status',
          parent_id: '900900799744',
          data: [Object],
          source: null,
          user: [Object],
          before: [Object],
          after: [Object]
        }
      ],
      task: sampleTask,
      webhook_id: '9b2708b6-87e8-4fff-851a-2ebf0e35130f'
    }
  },
  {
    name: "task_updated",
    eventType: ClickupEventType.TASK_UPDATED,
    displayName: 'Task updated',
    description: 'Triggered when a task is updated.',
    sampleData: {
      event: 'taskUpdated',
      history_items: [
        {
          id: '3394266113344261722',
          type: 1,
          date: '1678110165596',
          field: 'name',
          parent_id: '900900799744',
          data: {},
          source: null,
          user: [Object],
          before: "Watch over Neriah's",
          after: "Watch over Neriah's things"
        }
      ],
      task: sampleTask,
      task_id: 'sadsdsjddd',
      webhook_id: 'c065bdfd-eb7a-48dc-b25e-0cf5babf5ec8'
    }
  },
  {
    name: "task_deleted",
    eventType: ClickupEventType.TASK_DELETED,
    displayName: 'Task deleted',
    description: 'Triggered when a task is deleted.',
    sampleData: {
      event: 'taskDeleted',
      task_id: '8669p1zvv',
      webhook_id: '78674f1e-ec8e-4302-908f-4190bdcfdf6a'
    }
  },
  {
    name: "task_comment_posted",
    eventType: ClickupEventType.TASK_COMMENT_POSTED,
    displayName: 'Task comment posted',
    description: 'Triggered when a task comment is posted.',
    sampleData: {
      event: 'taskCommentPosted',
      history_items: [
        {
          id: '3394271120907039255',
          type: 1,
          date: '1678110464062',
          field: 'comment',
          parent_id: '900900799744',
          data: {},
          source: null,
          user: [Object],
          before: null,
          after: '90090008088251',
          comment: [Object]
        }
      ],
      task: sampleTask,
      webhook_id: '6a86ce24-6276-4315-87f7-b580a9264284'
    }
  },
  {
    name: "task_comment_updated",
    eventType: ClickupEventType.TASK_COMMENT_UPDATED,
    displayName: 'Task comment updated',
    description: 'Triggered when a task comment is updated.',
    sampleData: {
      event: 'taskCommentUpdated',
      history_items: [
        {
          id: '3394271120907039255',
          type: 1,
          date: '1678110464062',
          field: 'comment',
          parent_id: '900900799744',
          data: {},
          source: null,
          user: [Object],
          before: null,
          after: '90090008088251',
          comment: [Object]
        }
      ],
      task: sampleTask,
      webhook_id: '1c14c8af-5509-4d81-ae7f-c0790c0f9683'
    }
  }
].map((props) => clickupRegisterTrigger(props))