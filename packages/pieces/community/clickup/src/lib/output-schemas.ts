import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const userFields: OutputSchemaField[] = [
  {
    "key": "id",
    "label": "User ID",
    "value": "id"
  },
  {
    "key": "username",
    "label": "Username",
    "value": "username"
  },
  {
    "key": "email",
    "label": "Email",
    "value": "email",
    "format": "email"
  },
  {
    "key": "color",
    "label": "Color",
    "value": "color"
  },
  {
    "key": "initials",
    "label": "Initials",
    "value": "initials"
  },
  {
    "key": "profilePicture",
    "label": "Profile Picture",
    "value": "profilePicture",
    "format": "image"
  }
];

const taskFields: OutputSchemaField[] = [
  {
    "key": "name",
    "label": "Task Name"
  },
  {
    "key": "id",
    "label": "Task ID"
  },
  {
    "key": "description",
    "label": "Description"
  },
  {
    "key": "status",
    "label": "Status",
    "children": [
      {
        "key": "status",
        "label": "Status"
      },
      {
        "key": "type",
        "label": "Type"
      },
      {
        "key": "color",
        "label": "Color"
      }
    ]
  },
  {
    "key": "url",
    "label": "URL",
    "format": "url"
  },
  {
    "key": "date_created",
    "label": "Date Created",
    "format": "datetime"
  },
  {
    "key": "date_updated",
    "label": "Date Updated",
    "format": "datetime"
  },
  {
    "key": "due_date",
    "label": "Due Date",
    "format": "datetime"
  },
  {
    "key": "start_date",
    "label": "Start Date",
    "format": "datetime"
  },
  {
    "key": "priority",
    "label": "Priority"
  },
  {
    "key": "time_spent",
    "label": "Time Spent",
    "format": "duration"
  },
  {
    "key": "archived",
    "label": "Archived",
    "format": "boolean"
  },
  {
    "key": "creator",
    "label": "Creator",
    "children": [
      {
        "key": "username",
        "label": "Username"
      },
      {
        "key": "email",
        "label": "Email",
        "format": "email"
      },
      {
        "key": "id",
        "label": "User ID"
      }
    ]
  },
  {
    "key": "watchers",
    "label": "Watchers",
    "labelKey": "username",
    "listItems": [
      {
        "key": "username",
        "label": "Username"
      },
      {
        "key": "email",
        "label": "Email",
        "format": "email"
      },
      {
        "key": "id",
        "label": "User ID"
      }
    ]
  },
  {
    "key": "list",
    "label": "List",
    "children": [
      {
        "key": "name",
        "label": "Name"
      },
      {
        "key": "id",
        "label": "List ID"
      }
    ]
  },
  {
    "key": "folder",
    "label": "Folder",
    "children": [
      {
        "key": "name",
        "label": "Name"
      },
      {
        "key": "id",
        "label": "Folder ID"
      }
    ]
  },
  {
    "key": "space",
    "label": "Space",
    "children": [
      {
        "key": "id",
        "label": "Space ID"
      }
    ]
  },
  {
    "key": "team_id",
    "label": "Team ID"
  }
];

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const listOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "name",
      "label": "List Name"
    },
    {
      "key": "id",
      "label": "List ID"
    },
    {
      "key": "content",
      "label": "Content"
    },
    {
      "key": "task_count",
      "label": "Task Count",
      "format": "number"
    },
    {
      "key": "archived",
      "label": "Archived",
      "format": "boolean"
    },
    {
      "key": "permission_level",
      "label": "Permission Level"
    },
    {
      "key": "override_statuses",
      "label": "Override Statuses",
      "format": "boolean"
    },
    {
      "key": "inbound_address",
      "label": "Inbound Email Address",
      "format": "email"
    },
    {
      "key": "folder",
      "label": "Folder",
      "children": [
        {
          "key": "name",
          "label": "Folder Name"
        },
        {
          "key": "id",
          "label": "Folder ID"
        },
        {
          "key": "hidden",
          "label": "Hidden",
          "format": "boolean"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        }
      ]
    },
    {
      "key": "space",
      "label": "Space",
      "children": [
        {
          "key": "name",
          "label": "Space Name"
        },
        {
          "key": "id",
          "label": "Space ID"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        }
      ]
    },
    {
      "key": "statuses",
      "label": "Statuses",
      "labelKey": "status",
      "listItems": [
        {
          "key": "status",
          "label": "Status"
        },
        {
          "key": "id",
          "label": "Status ID"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "color",
          "label": "Color"
        },
        {
          "key": "orderindex",
          "label": "Order Index",
          "format": "number"
        }
      ]
    }
  ]
};

export const spaceOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "name",
      "label": "Name"
    },
    {
      "key": "id",
      "label": "Space ID"
    },
    {
      "key": "private",
      "label": "Private",
      "format": "boolean"
    },
    {
      "key": "color",
      "label": "Color"
    },
    {
      "key": "admin_can_manage",
      "label": "Admin Can Manage",
      "format": "boolean"
    },
    {
      "key": "multiple_assignees",
      "label": "Multiple Assignees",
      "format": "boolean"
    },
    {
      "key": "archived",
      "label": "Archived",
      "format": "boolean"
    },
    {
      "key": "statuses",
      "label": "Statuses",
      "labelKey": "status",
      "listItems": [
        {
          "key": "status",
          "label": "Status"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "id",
          "label": "Status ID"
        },
        {
          "key": "color",
          "label": "Color"
        },
        {
          "key": "orderindex",
          "label": "Order Index",
          "format": "number"
        }
      ]
    },
    {
      "key": "features",
      "label": "Features",
      "children": [
        {
          "key": "due_dates.enabled",
          "label": "Due Dates Enabled",
          "format": "boolean"
        },
        {
          "key": "sprints.enabled",
          "label": "Sprints Enabled",
          "format": "boolean"
        },
        {
          "key": "time_tracking.enabled",
          "label": "Time Tracking Enabled",
          "format": "boolean"
        },
        {
          "key": "tags.enabled",
          "label": "Tags Enabled",
          "format": "boolean"
        },
        {
          "key": "custom_fields.enabled",
          "label": "Custom Fields Enabled",
          "format": "boolean"
        },
        {
          "key": "milestones.enabled",
          "label": "Milestones Enabled",
          "format": "boolean"
        },
        {
          "key": "priorities.enabled",
          "label": "Priorities Enabled",
          "format": "boolean"
        },
        {
          "key": "priorities.priorities",
          "label": "Priorities",
          "labelKey": "priority",
          "listItems": [
            {
              "key": "priority",
              "label": "Priority"
            },
            {
              "key": "id",
              "label": "Priority ID"
            },
            {
              "key": "color",
              "label": "Color"
            },
            {
              "key": "orderindex",
              "label": "Order Index"
            }
          ]
        }
      ]
    }
  ]
};

export const getSpacesOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "spaces",
      "label": "Spaces",
      "labelKey": "name",
      "listItems": [
        {
          "key": "name",
          "label": "Name"
        },
        {
          "key": "id",
          "label": "Space ID"
        },
        {
          "key": "color",
          "label": "Color"
        },
        {
          "key": "private",
          "label": "Private",
          "format": "boolean"
        },
        {
          "key": "admin_can_manage",
          "label": "Admin Can Manage",
          "format": "boolean"
        },
        {
          "key": "multiple_assignees",
          "label": "Multiple Assignees",
          "format": "boolean"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        },
        {
          "key": "statuses",
          "label": "Statuses",
          "labelKey": "status",
          "listItems": [
            {
              "key": "status",
              "label": "Status"
            },
            {
              "key": "type",
              "label": "Type"
            },
            {
              "key": "color",
              "label": "Color"
            },
            {
              "key": "orderindex",
              "label": "Order Index",
              "format": "number"
            },
            {
              "key": "id",
              "label": "Status ID"
            }
          ]
        },
        {
          "key": "features",
          "label": "Features",
          "children": [
            {
              "key": "due_dates_enabled",
              "label": "Due Dates Enabled",
              "value": "due_dates.enabled",
              "format": "boolean"
            },
            {
              "key": "sprints_enabled",
              "label": "Sprints Enabled",
              "value": "sprints.enabled",
              "format": "boolean"
            },
            {
              "key": "time_tracking_enabled",
              "label": "Time Tracking Enabled",
              "value": "time_tracking.enabled",
              "format": "boolean"
            },
            {
              "key": "points_enabled",
              "label": "Points Enabled",
              "value": "points.enabled",
              "format": "boolean"
            },
            {
              "key": "tags_enabled",
              "label": "Tags Enabled",
              "value": "tags.enabled",
              "format": "boolean"
            },
            {
              "key": "custom_fields_enabled",
              "label": "Custom Fields Enabled",
              "value": "custom_fields.enabled",
              "format": "boolean"
            },
            {
              "key": "milestones_enabled",
              "label": "Milestones Enabled",
              "value": "milestones.enabled",
              "format": "boolean"
            },
            {
              "key": "priorities",
              "label": "Priorities",
              "value": "priorities.priorities",
              "labelKey": "priority",
              "listItems": [
                {
                  "key": "priority",
                  "label": "Priority"
                },
                {
                  "key": "color",
                  "label": "Color"
                },
                {
                  "key": "id",
                  "label": "Priority ID"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const filterWorkspaceTasksOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "tasks",
      "label": "Tasks",
      "labelKey": "name",
      "listItems": [
        {
          "key": "name",
          "label": "Name"
        },
        {
          "key": "id",
          "label": "Task ID"
        },
        {
          "key": "status",
          "label": "Status",
          "value": "status.status"
        },
        {
          "key": "url",
          "label": "URL",
          "format": "url"
        },
        {
          "key": "description",
          "label": "Description"
        },
        {
          "key": "priority",
          "label": "Priority",
          "value": "priority.priority"
        },
        {
          "key": "due_date",
          "label": "Due Date",
          "format": "date"
        },
        {
          "key": "start_date",
          "label": "Start Date",
          "format": "date"
        },
        {
          "key": "date_created",
          "label": "Date Created",
          "format": "date"
        },
        {
          "key": "date_updated",
          "label": "Date Updated",
          "format": "date"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        },
        {
          "key": "creator",
          "label": "Creator",
          "children": [
            {
              "key": "username",
              "label": "Username"
            },
            {
              "key": "email",
              "label": "Email",
              "format": "email"
            },
            {
              "key": "id",
              "label": "User ID"
            }
          ]
        },
        {
          "key": "assignees",
          "label": "Assignees",
          "labelKey": "username",
          "listItems": [
            {
              "key": "username",
              "label": "Username"
            },
            {
              "key": "email",
              "label": "Email",
              "format": "email"
            },
            {
              "key": "id",
              "label": "User ID"
            }
          ]
        },
        {
          "key": "list",
          "label": "List",
          "children": [
            {
              "key": "name",
              "label": "List Name"
            },
            {
              "key": "id",
              "label": "List ID"
            }
          ]
        },
        {
          "key": "folder",
          "label": "Folder",
          "children": [
            {
              "key": "name",
              "label": "Folder Name"
            },
            {
              "key": "id",
              "label": "Folder ID"
            }
          ]
        },
        {
          "key": "space",
          "label": "Space ID",
          "value": "space.id"
        },
        {
          "key": "team_id",
          "label": "Team ID"
        }
      ]
    },
    {
      "key": "last_page",
      "label": "Last Page",
      "format": "boolean"
    }
  ]
};

export const channelOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Channel",
      "children": [
        {
          "key": "name",
          "label": "Name"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "visibility",
          "label": "Visibility"
        },
        {
          "key": "id",
          "label": "Channel ID"
        },
        {
          "key": "creator",
          "label": "Creator ID"
        },
        {
          "key": "workspace_id",
          "label": "Workspace ID"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        },
        {
          "key": "created_at",
          "label": "Created At",
          "format": "datetime"
        },
        {
          "key": "updated_at",
          "label": "Updated At",
          "format": "datetime"
        },
        {
          "key": "parent",
          "label": "Parent",
          "children": [
            {
              "key": "id",
              "label": "Parent ID"
            },
            {
              "key": "type",
              "label": "Parent Type"
            }
          ]
        }
      ]
    }
  ]
};

export const getChannelOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Channels",
      "labelKey": "name",
      "listItems": [
        {
          "key": "name",
          "label": "Name"
        },
        {
          "key": "id",
          "label": "ID"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "visibility",
          "label": "Visibility"
        },
        {
          "key": "chat_room_category",
          "label": "Category"
        },
        {
          "key": "creator",
          "label": "Creator"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        },
        {
          "key": "is_canonical_channel",
          "label": "Is Canonical Channel",
          "format": "boolean"
        },
        {
          "key": "workspace_id",
          "label": "Workspace ID"
        },
        {
          "key": "created_at",
          "label": "Created At",
          "format": "datetime"
        },
        {
          "key": "updated_at",
          "label": "Updated At",
          "format": "datetime"
        },
        {
          "key": "latest_comment_at",
          "label": "Latest Comment At",
          "format": "datetime"
        },
        {
          "key": "parent",
          "label": "Parent",
          "children": [
            {
              "key": "id",
              "label": "Parent ID"
            },
            {
              "key": "type",
              "label": "Parent Type"
            }
          ]
        }
      ]
    }
  ]
};

export const getChannelsOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Channels",
      "labelKey": "name",
      "listItems": [
        {
          "key": "name",
          "label": "Name"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "visibility",
          "label": "Visibility"
        },
        {
          "key": "id",
          "label": "Channel ID"
        },
        {
          "key": "creator",
          "label": "Creator ID"
        },
        {
          "key": "archived",
          "label": "Archived",
          "format": "boolean"
        },
        {
          "key": "chat_room_category",
          "label": "Category"
        },
        {
          "key": "is_canonical_channel",
          "label": "Is Canonical Channel",
          "format": "boolean"
        },
        {
          "key": "workspace_id",
          "label": "Workspace ID"
        },
        {
          "key": "created_at",
          "label": "Created At",
          "format": "datetime"
        },
        {
          "key": "updated_at",
          "label": "Updated At",
          "format": "datetime"
        },
        {
          "key": "latest_comment_at",
          "label": "Latest Comment At",
          "format": "datetime"
        },
        {
          "key": "parent",
          "label": "Parent",
          "children": [
            {
              "key": "id",
              "label": "Parent ID"
            },
            {
              "key": "type",
              "label": "Parent Type"
            }
          ]
        }
      ]
    },
    {
      "key": "next_cursor",
      "label": "Next Cursor"
    }
  ]
};

export const messageOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "content",
      "label": "Content"
    },
    {
      "key": "type",
      "label": "Type"
    },
    {
      "key": "id",
      "label": "Message ID"
    },
    {
      "key": "date",
      "label": "Date",
      "format": "datetime"
    },
    {
      "key": "user_id",
      "label": "User ID"
    },
    {
      "key": "parent_channel",
      "label": "Parent Channel"
    },
    {
      "key": "replies_count",
      "label": "Replies Count",
      "format": "number"
    },
    {
      "key": "resolved",
      "label": "Resolved",
      "format": "boolean"
    }
  ]
};

export const channelMessagesOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Messages",
      "labelKey": "content",
      "listItems": [
        {
          "key": "content",
          "label": "Content"
        },
        {
          "key": "id",
          "label": "Message ID"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "user_id",
          "label": "User ID"
        },
        {
          "key": "parent_channel",
          "label": "Parent Channel"
        },
        {
          "key": "resolved",
          "label": "Resolved",
          "format": "boolean"
        },
        {
          "key": "replies_count",
          "label": "Replies Count",
          "format": "number"
        },
        {
          "key": "date",
          "label": "Date",
          "format": "datetime"
        },
        {
          "key": "date_assigned",
          "label": "Date Assigned",
          "format": "datetime"
        }
      ]
    },
    {
      "key": "next_cursor",
      "label": "Next Cursor"
    }
  ]
};

export const messageRepliesOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Replies",
      "labelKey": "content",
      "listItems": [
        {
          "key": "content",
          "label": "Content"
        },
        {
          "key": "id",
          "label": "Reply ID"
        },
        {
          "key": "type",
          "label": "Type"
        },
        {
          "key": "user_id",
          "label": "User ID"
        },
        {
          "key": "date",
          "label": "Date",
          "format": "datetime"
        },
        {
          "key": "resolved",
          "label": "Resolved",
          "format": "boolean"
        },
        {
          "key": "parent_message",
          "label": "Parent Message ID"
        },
        {
          "key": "parent_channel",
          "label": "Parent Channel"
        },
        {
          "key": "date_assigned",
          "label": "Date Assigned",
          "format": "datetime"
        }
      ]
    },
    {
      "key": "next_cursor",
      "label": "Next Cursor"
    }
  ]
};

export const getMessageReactionsOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "data",
      "label": "Reactions",
      "value": "data",
      "labelKey": "reaction",
      "listItems": [
        {
          "key": "reaction",
          "label": "Reaction",
          "value": "reaction"
        },
        {
          "key": "date",
          "label": "Date",
          "value": "date"
        },
        {
          "key": "user_id",
          "label": "User ID",
          "value": "user_id"
        }
      ]
    },
    {
      "key": "next_cursor",
      "label": "Next Cursor",
      "value": "next_cursor"
    }
  ]
};

export const createMessageReactionOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "reaction",
      "label": "Reaction",
      "value": "reaction"
    },
    {
      "key": "date",
      "label": "Date",
      "value": "date"
    },
    {
      "key": "user_id",
      "label": "User ID",
      "value": "user_id"
    }
  ]
};

export const createTaskCommentOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "id",
      "label": "Comment ID",
      "value": "id"
    },
    {
      "key": "hist_id",
      "label": "History ID",
      "value": "hist_id"
    },
    {
      "key": "date",
      "label": "Date",
      "value": "date"
    }
  ]
};

export const getTaskCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      value: 'comments',
      labelKey: 'comment_text',
      listItems: [
        { key: 'id', label: 'Comment ID', value: 'id' },
        { key: 'comment_text', label: 'Comment Text', value: 'comment_text' },
        { key: 'resolved', label: 'Resolved', value: 'resolved', format: 'boolean' },
        { key: 'date', label: 'Date', value: 'date' },
        { key: 'user', label: 'User', value: 'user', children: userFields },
      ],
    },
  ],
};

export const filterTimeEntriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Time Entries',
      value: 'data',
      labelKey: 'task.name',
      listItems: [
        { key: 'id', label: 'ID', value: 'id' },
        { key: 'task', label: 'Task', value: 'task', children: [
          { key: 'id', label: 'Task ID', value: 'id' },
          { key: 'name', label: 'Task Name', value: 'name' },
        ] },
        { key: 'wid', label: 'Workspace ID', value: 'wid' },
        { key: 'user', label: 'User', value: 'user', children: userFields },
        { key: 'billable', label: 'Billable', value: 'billable', format: 'boolean' },
        { key: 'start', label: 'Start', value: 'start' },
        { key: 'end', label: 'End', value: 'end' },
        { key: 'duration', label: 'Duration', value: 'duration' },
        { key: 'description', label: 'Description', value: 'description' },
      ],
    },
  ],
};

export const accessibleCustomFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'fields',
      label: 'Custom Fields',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Field ID', value: 'id' },
        { key: 'name', label: 'Name', value: 'name' },
        { key: 'type', label: 'Type', value: 'type' },
        { key: 'date_created', label: 'Date Created', value: 'date_created' },
        { key: 'hide_from_guests', label: 'Hide From Guests', value: 'hide_from_guests', format: 'boolean' },
      ],
    },
  ],
};

const triggerEventField: OutputSchemaField = { key: 'event', label: 'Event', value: 'event' };

const triggerTeamWebhookFields: OutputSchemaField[] = [
  { key: 'team_id', label: 'Team ID', value: 'team_id' },
  { key: 'webhook_id', label: 'Webhook ID', value: 'webhook_id' },
];

const triggerHistoryItemsField: OutputSchemaField = {
  key: 'history_items',
  label: 'History Items',
  value: 'history_items',
  labelKey: 'field',
  listItems: [
    { key: 'id', label: 'ID', value: 'id' },
    { key: 'type', label: 'Type', value: 'type', format: 'number' },
    { key: 'date', label: 'Date', value: 'date' },
    { key: 'field', label: 'Field', value: 'field' },
    { key: 'parent_id', label: 'Parent ID', value: 'parent_id' },
    { key: 'before', label: 'Before', value: 'before' },
    { key: 'after', label: 'After', value: 'after' },
    { key: 'user', label: 'User', value: 'user', children: userFields },
  ],
};

export const taskEventTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'task_id', label: 'Task ID', value: 'task_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
    { key: 'task', label: 'Task', value: 'task', children: taskFields },
  ],
};

export const taskHistoryTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'task_id', label: 'Task ID', value: 'task_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const listTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'list_id', label: 'List ID', value: 'list_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const folderTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'folder_id', label: 'Folder ID', value: 'folder_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const spaceTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'space_id', label: 'Space ID', value: 'space_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const goalTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'goal_id', label: 'Goal ID', value: 'goal_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const keyResultTriggerOutputSchema: OutputSchema = {
  fields: [
    triggerEventField,
    { key: 'goal_id', label: 'Goal ID', value: 'goal_id' },
    { key: 'key_result_id', label: 'Key Result ID', value: 'key_result_id' },
    ...triggerTeamWebhookFields,
    triggerHistoryItemsField,
  ],
};

export const automationCreatedTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', value: 'id' },
    { key: 'trigger_id', label: 'Trigger ID', value: 'trigger_id' },
    { key: 'date', label: 'Date', value: 'date', format: 'datetime' },
    { key: 'payload', label: 'Task', value: 'payload', children: taskFields },
  ],
};

export const clickupTriggerOutputSchemas: Record<string, OutputSchema> = {
  task_created: taskEventTriggerOutputSchema,
  task_updated: taskEventTriggerOutputSchema,
  task_comment_posted: taskEventTriggerOutputSchema,
  task_comment_updated: taskEventTriggerOutputSchema,
  task_deleted: taskHistoryTriggerOutputSchema,
  task_priority_updated: taskHistoryTriggerOutputSchema,
  task_status_updated: taskHistoryTriggerOutputSchema,
  task_assignee_updated: taskHistoryTriggerOutputSchema,
  task_due_date_updated: taskHistoryTriggerOutputSchema,
  task_tag_updated: taskHistoryTriggerOutputSchema,
  task_moved: taskHistoryTriggerOutputSchema,
  task_time_estimate_updated: taskHistoryTriggerOutputSchema,
  task_time_tracked_updated: taskHistoryTriggerOutputSchema,
  list_created: listTriggerOutputSchema,
  list_updated: listTriggerOutputSchema,
  list_deleted: listTriggerOutputSchema,
  folder_created: folderTriggerOutputSchema,
  folder_updated: folderTriggerOutputSchema,
  folder_deleted: folderTriggerOutputSchema,
  space_created: spaceTriggerOutputSchema,
  space_updated: spaceTriggerOutputSchema,
  space_deleted: spaceTriggerOutputSchema,
  automation_created: automationCreatedTriggerOutputSchema,
  goal_created: goalTriggerOutputSchema,
  goal_updated: goalTriggerOutputSchema,
  goal_deleted: goalTriggerOutputSchema,
  key_result_created: keyResultTriggerOutputSchema,
  key_result_updated: keyResultTriggerOutputSchema,
  key_result_deleted: keyResultTriggerOutputSchema,
};
