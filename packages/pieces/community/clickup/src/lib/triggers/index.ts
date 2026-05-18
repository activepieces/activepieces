import { ClickupEventType } from '../common/models';
import { clickupRegisterTrigger } from './register-trigger';
import { triggerTaskTagUpdated } from './task-tag-updated';

export const sampleTask = {
  id: 'string',
  custom_id: 'string',
  name: 'string',
  text_content: 'string',
  description: 'string',
  status: {
    status: 'in progress',
    color: '#d3d3d3',
    orderindex: 1,
    type: 'custom',
  },
  orderindex: 'string',
  date_created: 'string',
  date_updated: 'string',
  date_closed: 'string',
  creator: {
    id: 183,
    username: 'John Doe',
    color: '#827718',
    profilePicture:
      'https://attachments-public.clickup.com/profilePictures/183_abc.jpg',
  },
  assignees: ['string'],
  checklists: ['string'],
  tags: ['string'],
  parent: 'string',
  priority: 'string',
  due_date: 'string',
  start_date: 'string',
  time_estimate: 'string',
  time_spent: 'string',
  custom_fields: [
    {
      id: 'string',
      name: 'string',
      type: 'string',
      type_config: {},
      date_created: 'string',
      hide_from_guests: true,
      value: {
        id: 183,
        username: 'John Doe',
        email: 'john@example.com',
        color: '#7b68ee',
        initials: 'JD',
        profilePicture: null,
      },
      required: true,
    },
  ],
  list: {
    id: '123',
  },
  folder: {
    id: '456',
  },
  space: {
    id: '789',
  },
  url: 'string',
};

export const triggers = [
  // task created
  {
    name: 'task_created',
    eventType: ClickupEventType.TASK_CREATED,
    displayName: 'Task Created',
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
          data: {},
          source: null,
          user: {
            id: 55053258,
            username: 'Activepieces Apps',
            email: 'apps@activepieces.com',
            color: '#aa2fff',
            initials: 'AA',
            profilePicture: null,
          },
          before: null,
          after: '90040005586783',
        },
      ],
      task: sampleTask,
      task_id: '8669p1zvv',
      webhook_id: '9b2708b6-87e8-4fff-851a-2ebf0e35130f',
    },
  },
  // task updated
  {
    name: 'task_updated',
    eventType: ClickupEventType.TASK_UPDATED,
    displayName: 'Task Updated',
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
          user: {
            id: 55053258,
            username: 'Activepieces Apps',
            email: 'apps@activepieces.com',
            color: '#aa2fff',
            initials: 'AA',
            profilePicture: null,
          },
          before: "Watch over Neriah's",
          after: "Watch over Neriah's things",
        },
      ],
      task: sampleTask,
      task_id: '8669p1zvv',
      webhook_id: 'c065bdfd-eb7a-48dc-b25e-0cf5babf5ec8',
    },
  },
  // task deleted
  {
    name: 'task_deleted',
    eventType: ClickupEventType.TASK_DELETED,
    displayName: 'Task Deleted',
    description: 'Triggered when a task is deleted.',
    sampleData: {
      event: 'taskDeleted',
      task_id: '8669p1zvv',
      webhook_id: '78674f1e-ec8e-4302-908f-4190bdcfdf6a',
    },
  },
  // task priority updated
  {
    name: 'task_priority_updated',
    eventType: ClickupEventType.TASK_PRIORITY_UPDATED,
    displayName: "Task Priority Updated",
    description: 'Triggered when a task priority is updated.',
    sampleData: {
      "event": "taskPriorityUpdated",
      "history_items": [
        {
          "id": "2800773800802162647",
          "type": 1,
          "date": "1642735267148",
          "field": "priority",
          "parent_id": "162641062",
          "data": {},
          "source": null,
          "user": {
            "id": 183,
            "username": "John",
            "email": "john@company.com",
            "color": "#7b68ee",
            "initials": "J",
            "profilePicture": null
          },
          "before": null,
          "after": {
            "id": "2",
            "priority": "high",
            "color": "#ffcc00",
            "orderindex": "2"
          }
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task status updated
  {
    name: 'task_status_updated',
    eventType: ClickupEventType.TASK_STATUS_UPDATED,
    displayName: 'Task Status Updated',
    description: 'Triggered when a task status is updated.',
    sampleData: {
      "event": "taskStatusUpdated",
      "history_items": [
        {
          "id": "2800787326392370170",
          "type": 1,
          "date": "1642736073330",
          "field": "status",
          "parent_id": "162641062",
          "data": {
            "status_type": "custom"
          },
          "source": null,
          "user": {
                "id": 183,
                "username": "John",
                "email": "john@company.com",
                "color": "#7b68ee",
                "initials": "J",
                "profilePicture": null
          },
          "before": {
            "status": "to do",
            "color": "#f9d900",
            "orderindex": 0,
            "type": "open"
          },
          "after": {
            "status": "in progress",
            "color": "#7C4DFF",
            "orderindex": 1,
            "type": "custom"
          }
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task assignee updated
  {
    name: 'task_assignee_updated',
    eventType: ClickupEventType.TASK_ASSIGNEE_UPDATED,
    displayName: 'Task Assignee Updated',
    description: 'Triggered when a task assignee is updated.',
    sampleData: {
      "event": "taskAssigneeUpdated",
      "history_items": [
        {
          "id": "2800789353868594308",
          "type": 1,
          "date": "1642736194135",
          "field": "assignee_add",
          "parent_id": "162641062",
          "data": {},
          "source": null,
          "user": {
            "id": 183,
            "username": "John",
            "email": "john@company.com",
            "color": "#7b68ee",
            "initials": "J",
            "profilePicture": null
          },
          "after": {
            "id": 184,
            "username": "Sam",
            "email": "sam@company.com",
            "color": "#7b68ee",
            "initials": "S",
            "profilePicture": null
          }
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task due date updated
  {
    name: 'task_due_date_updated',
    eventType: ClickupEventType.TASK_DUEDATE_UPDATED,
    displayName: 'Task Due Date Updated',
    description: 'Triggered when a task due date is updated.',
    sampleData: {
      "event": "taskDueDateUpdated",
      "history_items": [
        {
          "id": "2800792714143635886",
          "type": 1,
          "date": "1642736394447",
          "field": "due_date",
          "parent_id": "162641062",
          "data": {
            "due_date_time": true,
            "old_due_date_time": false
          },
          "source": null,
          "user": {
            "id": 183,
            "username": "John",
            "email": "john@company.com",
            "color": "#7b68ee",
            "initials": "J",
            "profilePicture": null
          },
          "before": "1642701600000",
          "after": "1643608800000"
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task tag updated
  {
    name: 'task_tag_updated',
    eventType: ClickupEventType.TASK_TAG_UPDATED,
    displayName: 'Task Tag Updated',
    description: 'Triggered when a task tag is updated.',
    sampleData: {
      "event": "taskTagUpdated",
      "history_items": [
        {
          "id": "2800797048554170804",
          "type": 1,
          "date": "1642736652800",
          "field": "tag",
          "parent_id": "162641062",
          "data": {},
          "source": null,
          "user": {
            "id": 183,
            "username": "John",
            "email": "john@company.com",
            "color": "#7b68ee",
            "initials": "J",
            "profilePicture": null
          },
          "before": null,
          "after": [
            {
              "name": "def",
              "tag_fg": "#FF4081",
              "tag_bg": "#FF4081",
              "creator": 2770032
            }
          ]
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task moved
  {
    name: 'task_moved',
    eventType: ClickupEventType.TASK_MOVED,
    displayName: 'Task Moved',
    description: 'Triggered when a task is moved.',
    sampleData: {
      "event": "taskMoved",
      "history_items": [
        {
          "id": "2800800851630274181",
          "type": 1,
          "date": "1642736879339",
          "field": "section_moved",
          "parent_id": "162641285",
          "data": {
            "mute_notifications": true
          },
          "source": null,
          "user": {
            "id": 183,
            "username": "John",
            "email": "john@company.com",
            "color": "#7b68ee",
            "initials": "J",
            "profilePicture": null
          },
          "before": {
            "id": "162641062",
            "name": "Webhook payloads",
            "category": {
              "id": "96771950",
              "name": "hidden",
              "hidden": true
            },
            "project": {
              "id": "7002367",
              "name": "This is my API Space"
            }
          },
          "after": {
            "id": "162641285",
            "name": "webhook payloads 2",
            "category": {
              "id": "96772049",
              "name": "hidden",
              "hidden": true
            },
            "project": {
              "id": "7002367",
              "name": "This is my API Space"
            }
          }
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task comment posted
  {
    name: 'task_comment_posted',
    eventType: ClickupEventType.TASK_COMMENT_POSTED,
    displayName: 'Task Comment Posted',
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
          user: {
            id: 55053258,
            username: 'Activepieces Apps',
            email: 'apps@activepieces.com',
            color: '#aa2fff',
            initials: 'AA',
            profilePicture: null,
          },
          before: null,
          after: '90090008088251',
          comment: [
            {
              text: 'asdsada',
              attributes: {},
            },
          ],
        },
      ],
      task: sampleTask,
      task_id: '8669p1zvv',
      webhook_id: '6a86ce24-6276-4315-87f7-b580a9264284',
    },
  },
  // task comment updated
  {
    name: 'task_comment_updated',
    eventType: ClickupEventType.TASK_COMMENT_UPDATED,
    displayName: 'Task Comment Updated',
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
          user: {
            id: 55053258,
            username: 'Activepieces Apps',
            email: 'apps@activepieces.com',
            color: '#aa2fff',
            initials: 'AA',
            profilePicture: null,
          },
          before: null,
          after: '90090008088251',
          comment: [
            {
              text: 'asdsada',
              attributes: {},
            },
          ],
        },
      ],
      task: sampleTask,
      task_id: '8669p1zvv',
      webhook_id: '1c14c8af-5509-4d81-ae7f-c0790c0f9683',
    },
  },
  // task time estimate updated
  {
    name: 'task_time_estimate_updated',
    eventType: ClickupEventType.TASK_TIME_ESTIMATE_UPDATED,
    displayName: 'Task Time Estimate Updated',
    description: 'Triggered when a task time estimate is updated.',
    sampleData: {
      "event": "taskTimeEstimateUpdated",
      "history_items": [
        {
          "id": "2800808904123520175",
          "type": 1,
          "date": "1642737359443",
          "field": "time_estimate",
          "parent_id": "162641285",
          "data": {
            "time_estimate_string": "1 hour 30 minutes",
            "old_time_estimate_string": null,
            "rolled_up_time_estimate": 5400000,
            "time_estimate": 5400000,
            "time_estimates_by_user": [
              {
                "userid": 2770032,
                "user_time_estimate": "5400000",
                "user_rollup_time_estimate": "5400000"
              }
            ]
          },
          "source": null,
          "user": {
                "id": 183,
                "username": "John",
                "email": "john@company.com",
                "color": "#7b68ee",
                "initials": "J",
                "profilePicture": null
          },
          "before": null,
          "after": "5400000"
        }
      ],
      "task_id": "1vj38vv",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // task time tracked updated
  {
    name: 'task_time_tracked_updated',
    eventType: ClickupEventType.TASK_TIME_TRACKED_UPDATED,
    displayName: 'Task Time Tracked Updated',
    description: 'Triggered when a task time tracked is updated.',
    sampleData: {
      "event": "taskTimeTrackedUpdated",
      "history_items": [
        {
          "id": "2800809188061123931",
          "type": 1,
          "date": "1642737376354",
          "field": "time_spent",
          "parent_id": "162641285",
          "data": {
            "total_time": "900000",
            "rollup_time": "900000"
          },
          "source": null,
          "user": {
                "id": 183,
                "username": "John",
                "email": "john@company.com",
                "color": "#7b68ee",
                "initials": "J",
                "profilePicture": null
          },
          "before": null,
          "after": {
            "id": "2800809188061119507",
            "start": "1642736476215",
            "end": "1642737376215",
            "time": "900000",
            "source": "clickup",
            "date_added": "1642737376354"
          }
        }
      ],
      "task_id": "1vj38vv",
      "data": {
        "description": "Time Tracking Created",
        "interval_id": "2800809188061119507"
      },
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // list created
  {
    name: 'list_created',
    eventType: ClickupEventType.LIST_CREATED,
    displayName: 'List Created',
    description: 'Triggered when a new list is created.',
    sampleData: {
      event: 'listCreated',
      list_id: '900201745120',
      webhook_id: 'eda9be69-dbb9-4c59-a3e2-3f871d5d3b9e',
    },
  },
  // list updated
  {
    name: 'list_updated',
    eventType: ClickupEventType.LIST_UPDATED,
    displayName: 'List Updated',
    description: 'Triggered when a list is updated.',
    sampleData: {
      "event": "listUpdated",
      "history_items": [
        {
          "id": "8a2f82db-7718-4fdb-9493-4849e67f009d",
          "type": 6,
          "date": "1642740510345",
          "field": "name",
          "parent_id": "162641285",
          "data": {},
          "source": null,
          "user": {
                "id": 183,
                "username": "John",
                "email": "john@company.com",
                "color": "#7b68ee",
                "initials": "J",
                "profilePicture": null
          },
          "before": "webhook payloads 2",
          "after": "Webhook payloads round 2"
        }
      ],
      "list_id": "162641285",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // list deleted
  {
    name: 'list_deleted',
    eventType: ClickupEventType.LIST_DELETED,
    displayName: 'List Deleted',
    description: 'Triggered when a list is deleted.',
    sampleData: {
      "event": "listDeleted",
      "list_id": "162641062",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // folder created
  {
    name: 'folder_created',
    eventType: ClickupEventType.FOLDER_CREATED,
    displayName: 'Folder Created',
    description: 'Triggered when a new folder is created.',
    sampleData: {
      "event": "folderCreated",
      "folder_id": "96772212",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // folder updated
  {
    name: 'folder_updated',
    eventType: ClickupEventType.FOLDER_UPDATED,
    displayName: 'Folder Updated',
    description: 'Triggered when a folder is updated.',
    sampleData: { "event": "folderUpdated",
      "folder_id": "96772212",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // folder deleted
  {
    name: 'folder_deleted',
    eventType: ClickupEventType.FOLDER_DELETED,
    displayName: 'Folder Deleted',
    description: 'Triggered when a folder is deleted.',
    sampleData: {
      "event": "listDeleted",
      "list_id": "162641543",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // space created
  {
    name: 'space_created',
    eventType: ClickupEventType.SPACE_CREATED,
    displayName: 'Space Created',
    description: 'Triggered when a new space is created.',
    sampleData: {
      "event": "spaceCreated",
      "space_id": "54650507",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // space updated
  {
    name: 'space_updated',
    eventType: ClickupEventType.SPACE_UPDATED,
    displayName: 'Space Updated',
    description: 'Triggered when a space is updated.',
    sampleData: {
      "event": "spaceUpdated",
      "space_id": "54650507",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // space deleted
  {
    name: 'space_deleted',
    eventType: ClickupEventType.SPACE_DELETED,
    displayName: 'Space Deleted',
    description: 'Triggered when a space is deleted.',
    sampleData: {
      "event": "spaceDeleted",
      "space_id": "54650507",
      "webhook_id": "7fa3ec74-69a8-4530-a251-8a13730bd204"
    }
  },
  // automation created
  {
    name: 'automation_created',
    eventType: ClickupEventType.AUTOMATION_CREATED,
    displayName: 'Automation Created',
    description: 'Triggered when a new automation is created.',
    sampleData: {
      "id": "b4ced072-ae72-4c70-b898-fea5dd142408:main",
      "trigger_id": "6f612d16-9ff7-4db2-a2f6-19528ee3b90c",
      "date": "2024-01-11T19:40:17.927Z",
      "payload": {
        "id": "8687096vn",
        "custom_id": "DEF-43",
        "custom_item_id": 0,
        "name": "task name",
        "text_content": "",
        "description": "",
        "status": {
          "id": "p90090203753_p54073272_p54073128_p54071092_p54067915_r9V2QX7O",
          "status": "complete",
          "color": "#008844",
          "orderindex": 1,
          "type": "closed"
        },
        "orderindex": "39906954.00000000000000000000000000000000",
        "date_created": "1705002014968",
        "date_updated": "1705002016108",
        "date_closed": "1705002016108",
        "date_done": "1705002016108",
        "archived": false,
        "creator": {
          "id": 26191384,
          "username": "John",
          "color": "#5f7c8a",
          "email": "john@company.com",
          "profilePicture": "https://attachments.clickup.com/profilePictures/26191384_HoB.jpg"
        },
        "assignees": [],
        "watchers": [
          {
            "id": 26191384,
            "username": "John",
            "color": "#5f7c8a",
            "initials": "J",
            "email": "john@company.com",
            "profilePicture": "https://attachments.clickup.com/profilePictures/26191384_HoB.jpg"
          }
        ],
        "checklists": [],
        "tags": [],
        "parent": null,
        "priority": null,
        "due_date": null,
        "start_date": null,
        "points": null,
        "time_estimate": null,
        "time_spent": 0,
        "custom_fields": [
          {
            "id": "ede917d5-4dbb-46eb-9f7c-5d4f0a652b1f",
            "name": "ijjb",
            "type": "formula",
            "type_config": {
              "version": "1.6",
              "is_dynamic": false,
              "return_types": [
                "null"
              ],
              "calculation_state": "ready"
            },
            "date_created": "1698260411360",
            "hide_from_guests": false,
            "required": false
          },
          {
            "id": "7d979288-84e1-48b0-abaf-238ecb27e0fa",
            "name": "formula 1",
            "type": "currency",
            "type_config": {
              "default": null,
              "precision": 2,
              "currency_type": "USD"
            },
            "date_created": "1694298925344",
            "hide_from_guests": false,
            "required": false
          },
          {
            "id": "89bbdeeb-6724-4ec0-a8a7-c21d944199a7",
            "name": "Marketing Task Type",
            "type": "drop_down",
            "type_config": {
              "default": 0,
              "placeholder": null,
              "options": [
                {
                  "id": "d73a55af-88f5-4161-a948-7341d2bbb045",
                  "name": "Campaign",
                  "color": null,
                  "orderindex": 0
                },
                {
                  "id": "0010111d-91da-4cb7-8cc1-d642f90ef194",
                  "name": "asd",
                  "color": null,
                  "orderindex": 1
                }
              ]
            },
            "date_created": "1698177406311",
            "hide_from_guests": false,
            "required": false
          },
          {
            "id": "07119fd9-e1eb-4457-bc69-3e5913707ca2",
            "name": "files",
            "type": "attachment",
            "type_config": {},
            "date_created": "1700237528128",
            "hide_from_guests": false,
            "required": false
          },
          {
            "id": "60392065-eb67-40c3-afe2-10f288d0695d",
            "name": "new field",
            "type": "currency",
            "type_config": {
              "precision": 2,
              "currency_type": "EUR"
            },
            "date_created": "1696603471462",
            "hide_from_guests": true,
            "required": false
          }
        ],
        "dependencies": [],
        "linked_tasks": [],
        "locations": [],
        "team_id": "36003581",
        "url": "https://app.clickup.com/t/8687096vn",
        "sharing": {
          "public": false,
          "public_share_expires_on": null,
          "public_fields": [
            "assignees",
            "priority",
            "due_date",
            "content",
            "comments",
            "attachments",
            "customFields",
            "subtasks",
            "tags",
            "checklists",
            "coverimage"
          ],
          "token": null,
          "seo_optimized": false
        },
        "list": {
          "id": "901102008938",
          "name": "List",
          "access": true
        },
        "project": {
          "id": "90110993233",
          "name": "test folder",
          "hidden": false,
          "access": true
        },
        "folder": {
          "id": "90110993233",
          "name": "test folder",
          "hidden": false,
          "access": true
        },
        "space": {
          "id": "90090203753"
        }
      }
    }
  },
  // goal created
  {
    name: 'goal_created',
    eventType: ClickupEventType.GOAL_CREATED,
    displayName: 'Goal Created',
    description: 'Triggered when a new goal is created.',
    sampleData: {
      "event": "goalCreated",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
  // goal updated
  {
    name: 'goal_updated',
    eventType: ClickupEventType.GOAL_UPDATED,
    displayName: 'Goal Updated',
    description: 'Triggered when a goal is updated.',
    sampleData: {
      "event": "goalUpdated",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
  // goal deleted
  {
    name: 'goal_deleted',
    eventType: ClickupEventType.GOAL_DELETED,
    displayName: 'Goal Deleted',
    description: 'Triggered when a goal is deleted.',
    sampleData: {
      "event": "goalDeleted",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
  // key result created
  {
    name: 'key_result_created',
    eventType: ClickupEventType.KEY_RESULT_CREATED,
    displayName: 'Key Result Created',
    description: 'Triggered when a new key result is created.',
    sampleData: {
      "event": "keyResultCreated",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "key_result_id": "47608e42-ad0e-4934-a39e-950539c77e79",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
  // key result updated
  {
    name: 'key_result_updated',
    eventType: ClickupEventType.KEY_RESULT_UPDATED,
    displayName: 'Key Result Updated',
    description: 'Triggered when a key result is updated.',
    sampleData: {
      "event": "keyResultUpdated",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "key_result_id": "47608e42-ad0e-4934-a39e-950539c77e79",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
  // key result deleted
  {
    name: 'key_result_deleted',
    eventType: ClickupEventType.KEY_RESULT_DELETED,
    displayName: 'Key Result Deleted',
    description: 'Triggered when a key result is deleted.',
    sampleData: {
      "event": "keyResultDeleted",
      "goal_id": "a23e5a3d-74b5-44c2-ab53-917ebe85045a",
      "key_result_id": "47608e42-ad0e-4934-a39e-950539c77e79",
      "webhook_id": "d5eddb2d-db2b-49e9-87d4-bc6cfbe2313b"
    }
  },
].map((props) => clickupRegisterTrigger(props));

export const clickupTriggers = [...triggers, triggerTaskTagUpdated];