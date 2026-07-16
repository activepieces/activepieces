import { OutputSchema } from '@activepieces/pieces-framework';

export const updatedPageTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'is_archived',
      label: 'Archived',
      value: 'is_archived',
      format: 'boolean',
    },
    {
      key: 'is_locked',
      label: 'Locked',
      value: 'is_locked',
      format: 'boolean',
    },
    {
      key: 'parent',
      label: 'Parent',
      value: 'parent',
      children: [
        {
          key: 'type',
          label: 'Parent Type',
          value: 'type',
        },
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'database_id',
        },
      ],
    },
    {
      key: 'last_edited_by',
      label: 'Last Edited By',
      value: 'last_edited_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: 'created_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'properties',
      label: 'Properties',
      value: 'properties',
      children: [
        {
          key: 'Task name',
          label: 'Task Name',
          value: 'Task name.title[0].plain_text',
        },
        {
          key: 'Status',
          label: 'Status',
          value: 'Status.status.name',
        },
        {
          key: 'Due date',
          label: 'Due Date',
          value: 'Due date.date.start',
          format: 'date',
        },
        {
          key: 'Assignee',
          label: 'Assignee User ID',
          value: 'Assignee.people[0].id',
        },
      ],
    },
  ],
};

export const newCommentTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Comment ID',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      format: 'datetime',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      format: 'datetime',
    },
    {
      key: 'discussion_id',
      label: 'Discussion ID',
    },
    {
      key: 'parent',
      label: 'Parent',
      children: [
        {
          key: 'type',
          label: 'Type',
        },
        {
          key: 'page_id',
          label: 'Page ID',
        },
      ],
    },
    {
      key: 'created_by_id',
      label: 'Created By',
      value: 'created_by.id',
    },
    {
      key: 'display_name',
      label: 'Display Name',
      value: 'display_name.resolved_name',
    },
    {
      key: 'rich_text',
      label: 'Rich Text',
      labelKey: 'plain_text',
      listItems: [
        {
          key: 'plain_text',
          label: 'Plain Text',
        },
        {
          key: 'type',
          label: 'Type',
        },
        {
          key: 'href',
          label: 'Link',
          format: 'url',
        },
      ],
    },
  ],
};

export const newDatabaseItemTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'taskName',
      label: 'Task Name',
      value: 'properties.Task name.title[0].plain_text',
    },
    {
      key: 'status',
      label: 'Status',
      value: 'properties.Status.status.name',
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      value: 'properties.Due date.date.start',
      format: 'date',
    },
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'createdTime',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'lastEditedTime',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'createdBy',
      label: 'Created By User ID',
      value: 'created_by.id',
    },
    {
      key: 'lastEditedBy',
      label: 'Last Edited By User ID',
      value: 'last_edited_by.id',
    },
    {
      key: 'isArchived',
      label: 'Archived',
      value: 'is_archived',
      format: 'boolean',
    },
    {
      key: 'isLocked',
      label: 'Locked',
      value: 'is_locked',
      format: 'boolean',
    },
    {
      key: 'parent',
      label: 'Parent',
      children: [
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'database_id',
        },
      ],
    },
    {
      key: 'assignees',
      label: 'Assignees',
      value: 'properties.Assignee.people',
      listItems: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
  ],
};

export const updatedDatabaseItemTriggerOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'object',
      label: 'Object Type',
      value: 'object',
    },
    {
      key: 'is_archived',
      label: 'Archived',
      value: 'is_archived',
      format: 'boolean',
    },
    {
      key: 'is_locked',
      label: 'Locked',
      value: 'is_locked',
      format: 'boolean',
    },
    {
      key: 'in_trash',
      label: 'In Trash',
      value: 'in_trash',
      format: 'boolean',
    },
    {
      key: 'parent',
      label: 'Parent',
      value: 'parent',
      children: [
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'database_id',
        },
      ],
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: 'created_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'last_edited_by',
      label: 'Last Edited By',
      value: 'last_edited_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'properties',
      label: 'Properties',
      value: 'properties',
      dynamicKey: true,
      children: [
        {
          key: 'type',
          label: 'Property Type',
          value: 'type',
        },
      ],
    },
  ],
};

export const createDatabaseItemActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'object',
      label: 'Object',
      value: 'object',
    },
    {
      key: 'parent',
      label: 'Parent',
      value: 'parent',
      children: [
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'database_id',
        },
      ],
    },
    {
      key: 'properties',
      label: 'Properties',
      value: 'properties',
      children: [
        {
          key: 'Task name',
          label: 'Task Name',
          value: 'Task name',
          children: [
            {
              key: 'plain_text',
              label: 'Title Text',
              value: 'title[0].plain_text',
            },
          ],
        },
        {
          key: 'Status',
          label: 'Status',
          value: 'Status',
          children: [
            {
              key: 'name',
              label: 'Status Name',
              value: 'status.name',
            },
          ],
        },
        {
          key: 'Assignee',
          label: 'Assignee',
          value: 'Assignee',
          children: [
            {
              key: 'people',
              label: 'People',
              value: 'people',
              listItems: [
                {
                  key: 'id',
                  label: 'User ID',
                  value: 'id',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: 'created_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'is_archived',
      label: 'Is Archived',
      value: 'is_archived',
      format: 'boolean',
    },
  ],
};

export const updateDatabaseItemActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'is_archived',
      label: 'Is Archived',
      value: 'is_archived',
      format: 'boolean',
    },
    {
      key: 'is_locked',
      label: 'Is Locked',
      value: 'is_locked',
      format: 'boolean',
    },
    {
      key: 'properties',
      label: 'Properties',
      value: 'properties',
      children: [
        {
          key: 'Task name',
          label: 'Task Name',
          value: 'Task name.title[0].plain_text',
        },
        {
          key: 'Status',
          label: 'Status',
          value: 'Status.status.name',
        },
        {
          key: 'Assignee',
          label: 'Assignee User IDs',
          value: 'Assignee.people',
          listItems: [
            {
              key: 'id',
              label: 'User ID',
              value: 'id',
            },
          ],
        },
      ],
    },
    {
      key: 'parent',
      label: 'Parent',
      value: 'parent',
      children: [
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'database_id',
        },
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
      ],
    },
    {
      key: 'created_by_id',
      label: 'Created By User ID',
      value: 'created_by.id',
    },
    {
      key: 'last_edited_by_id',
      label: 'Last Edited By User ID',
      value: 'last_edited_by.id',
    },
  ],
};

export const notionFindDatabaseItemActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'results',
      label: 'Results',
      value: 'results',
      listItems: [
        {
          key: 'taskName',
          label: 'Task Name',
          value: 'properties.Task name.title[0].plain_text',
        },
        {
          key: 'status',
          label: 'Status',
          value: 'properties.Status.status.name',
        },
        {
          key: 'id',
          label: 'Page ID',
          value: 'id',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'createdTime',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'lastEditedTime',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'databaseId',
          label: 'Database ID',
          value: 'parent.database_id',
        },
        {
          key: 'assignee',
          label: 'Assignee IDs',
          value: 'properties.Assignee.people',
          listItems: [
            {
              key: 'userId',
              label: 'User ID',
              value: 'id',
            },
          ],
        },
        {
          key: 'dueDate',
          label: 'Due Date',
          value: 'properties.Due date.date',
        },
      ],
    },
  ],
};

export const createPageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'url',
      label: 'Page URL',
      value: 'url',
      format: 'url',
    },
    {
      key: 'id',
      label: 'Page ID',
      value: 'id',
    },
    {
      key: 'object',
      label: 'Object Type',
      value: 'object',
    },
    {
      key: 'created_time',
      label: 'Created Time',
      value: 'created_time',
      format: 'datetime',
    },
    {
      key: 'last_edited_time',
      label: 'Last Edited Time',
      value: 'last_edited_time',
      format: 'datetime',
    },
    {
      key: 'is_archived',
      label: 'Is Archived',
      value: 'is_archived',
      format: 'boolean',
    },
    {
      key: 'is_locked',
      label: 'Is Locked',
      value: 'is_locked',
      format: 'boolean',
    },
    {
      key: 'in_trash',
      label: 'In Trash',
      value: 'in_trash',
      format: 'boolean',
    },
    {
      key: 'parent',
      label: 'Parent',
      value: 'parent',
      children: [
        {
          key: 'type',
          label: 'Parent Type',
          value: 'type',
        },
        {
          key: 'page_id',
          label: 'Parent Page ID',
          value: 'page_id',
        },
      ],
    },
    {
      key: 'created_by',
      label: 'Created By',
      value: 'created_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'last_edited_by',
      label: 'Last Edited By',
      value: 'last_edited_by',
      children: [
        {
          key: 'id',
          label: 'User ID',
          value: 'id',
        },
      ],
    },
  ],
};

export const appendToPageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Appended Blocks',
      value: 'results',
      listItems: [
        {
          key: 'type',
          label: 'Block Type',
        },
        {
          key: 'id',
          label: 'Block ID',
        },
        {
          key: 'has_children',
          label: 'Has Children',
          format: 'boolean',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          format: 'datetime',
        },
        {
          key: 'page_id',
          label: 'Parent Page ID',
          value: 'parent.page_id',
        },
        {
          key: 'archived',
          label: 'Archived',
          format: 'boolean',
        },
      ],
    },
    {
      key: 'has_more',
      label: 'Has More',
      format: 'boolean',
    },
    {
      key: 'next_cursor',
      label: 'Next Cursor',
    },
    {
      key: 'request_id',
      label: 'Request ID',
    },
  ],
};

export const getPageOrBlockChildrenActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'blocks',
      label: 'Blocks',
      value: '',
      listItems: [
        {
          key: 'type',
          label: 'Type',
          value: 'type',
        },
        {
          key: 'paragraph_text',
          label: 'Paragraph Text',
          value: 'paragraph.rich_text[0].plain_text',
        },
        {
          key: 'heading_2_text',
          label: 'Heading 2 Text',
          value: 'heading_2.rich_text[0].plain_text',
        },
        {
          key: 'bulleted_list_item_text',
          label: 'Bulleted List Item Text',
          value: 'bulleted_list_item.rich_text[0].plain_text',
        },
        {
          key: 'child_database_title',
          label: 'Child Database Title',
          value: 'child_database.title',
        },
        {
          key: 'id',
          label: 'Block ID',
          value: 'id',
        },
        {
          key: 'has_children',
          label: 'Has Children',
          value: 'has_children',
          format: 'boolean',
        },
        {
          key: 'parent_page_id',
          label: 'Parent Page ID',
          value: 'parent.page_id',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'archived',
          label: 'Archived',
          value: 'archived',
          format: 'boolean',
        },
      ],
    },
  ],
};

export const archiveDatabaseItemActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'message',
    },
    {
      key: 'archivedItem',
      label: 'Archived Item',
      value: 'archivedItem',
      children: [
        {
          key: 'title',
          label: 'Title',
          value: 'title',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'archived_at',
          label: 'Archived At',
          value: 'archived_at',
          format: 'datetime',
        },
        {
          key: 'id',
          label: 'ID',
          value: 'id',
        },
      ],
    },
    {
      key: 'fullResponse',
      label: 'Full Response',
      value: 'fullResponse',
      children: [
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'archived',
          label: 'Archived',
          value: 'archived',
          format: 'boolean',
        },
        {
          key: 'in_trash',
          label: 'In Trash',
          value: 'in_trash',
          format: 'boolean',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'id',
          label: 'Page ID',
          value: 'id',
        },
        {
          key: 'database_id',
          label: 'Database ID',
          value: 'parent.database_id',
        },
      ],
    },
  ],
};

export const restoreDatabaseItemActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
    },
    {
      key: 'restoredItem',
      label: 'Restored Item',
      children: [
        {
          key: 'title',
          label: 'Title',
          value: 'title',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'id',
          label: 'Item ID',
          value: 'id',
        },
        {
          key: 'restored_at',
          label: 'Restored At',
          value: 'restored_at',
          format: 'datetime',
        },
      ],
    },
    {
      key: 'fullResponse',
      label: 'Full Response',
      children: [
        {
          key: 'id',
          label: 'Page ID',
          value: 'id',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'is_archived',
          label: 'Is Archived',
          value: 'is_archived',
          format: 'boolean',
        },
        {
          key: 'in_trash',
          label: 'In Trash',
          value: 'in_trash',
          format: 'boolean',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'database_id',
          label: 'Parent Database ID',
          value: 'parent.database_id',
        },
      ],
    },
  ],
};

export const addCommentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'message',
    },
    {
      key: 'comment',
      label: 'Comment',
      value: 'comment',
      children: [
        {
          key: 'id',
          label: 'Comment ID',
          value: 'id',
        },
        {
          key: 'discussion_id',
          label: 'Discussion ID',
          value: 'discussion_id',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'parentPageId',
          label: 'Parent Page ID',
          value: 'parent.page_id',
        },
        {
          key: 'createdById',
          label: 'Created By (User ID)',
          value: 'created_by.id',
        },
        {
          key: 'displayName',
          label: 'Display Name',
          value: 'display_name.resolved_name',
        },
        {
          key: 'rich_text',
          label: 'Rich Text',
          value: 'rich_text',
          listItems: [
            {
              key: 'plain_text',
              label: 'Plain Text',
              value: 'plain_text',
            },
            {
              key: 'content',
              label: 'Content',
              value: 'text.content',
            },
          ],
        },
      ],
    },
  ],
};

export const retrieveDatabaseActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'message',
    },
    {
      key: 'summary',
      label: 'Summary',
      value: 'summary',
      children: [
        {
          key: 'title',
          label: 'Title',
          value: 'title',
        },
        {
          key: 'totalProperties',
          label: 'Total Properties',
          value: 'totalProperties',
          format: 'number',
        },
      ],
    },
    {
      key: 'formStructure',
      label: 'Form Structure',
      value: 'formStructure',
      children: [
        {
          key: 'title',
          label: 'Title',
          value: 'title',
        },
        {
          key: 'id',
          label: 'Database ID',
          value: 'id',
        },
        {
          key: 'propertyTypes',
          label: 'Property Types',
          value: 'propertyTypes',
          dynamicKey: true,
        },
        {
          key: 'selectOptions',
          label: 'Select Options',
          value: 'selectOptions',
          dynamicKey: true,
          listItems: [
            {
              key: 'name',
              label: 'Name',
              value: 'name',
            },
            {
              key: 'color',
              label: 'Color',
              value: 'color',
            },
            {
              key: 'id',
              label: 'ID',
              value: 'id',
            },
          ],
        },
      ],
    },
    {
      key: 'database',
      label: 'Database',
      value: 'database',
      children: [
        {
          key: 'title',
          label: 'Title',
          value: 'title[0].plain_text',
        },
        {
          key: 'id',
          label: 'ID',
          value: 'id',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'is_inline',
          label: 'Is Inline',
          value: 'is_inline',
          format: 'boolean',
        },
        {
          key: 'archived',
          label: 'Archived',
          value: 'archived',
          format: 'boolean',
        },
        {
          key: 'parent_type',
          label: 'Parent Type',
          value: 'parent.type',
        },
        {
          key: 'properties',
          label: 'Properties',
          value: 'properties',
          dynamicKey: true,
          children: [
            {
              key: 'name',
              label: 'Name',
              value: 'name',
            },
            {
              key: 'type',
              label: 'Type',
              value: 'type',
            },
            {
              key: 'id',
              label: 'ID',
              value: 'id',
            },
          ],
        },
      ],
    },
  ],
};

export const getPageCommentsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'message',
    },
    {
      key: 'totalComments',
      label: 'Total Comments',
      value: 'totalComments',
      format: 'number',
    },
    {
      key: 'discussionCount',
      label: 'Discussion Count',
      value: 'discussionCount',
      format: 'number',
    },
    {
      key: 'allComments',
      label: 'All Comments',
      value: 'allComments',
      listItems: [
        {
          key: 'plain_text',
          label: 'Text',
          value: 'rich_text[0].plain_text',
        },
        {
          key: 'resolved_name',
          label: 'Author',
          value: 'display_name.resolved_name',
        },
        {
          key: 'id',
          label: 'Comment ID',
          value: 'id',
        },
        {
          key: 'discussion_id',
          label: 'Discussion ID',
          value: 'discussion_id',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'created_by_id',
          label: 'Created By ID',
          value: 'created_by.id',
        },
        {
          key: 'page_id',
          label: 'Page ID',
          value: 'parent.page_id',
        },
      ],
    },
    {
      key: 'summary',
      label: 'Summary',
      value: 'summary',
      children: [
        {
          key: 'totalComments',
          label: 'Total Comments',
          value: 'totalComments',
          format: 'number',
        },
        {
          key: 'discussionThreads',
          label: 'Discussion Threads',
          value: 'discussionThreads',
          format: 'number',
        },
        {
          key: 'standaloneComments',
          label: 'Standalone Comments',
          value: 'standaloneComments',
          format: 'number',
        },
      ],
    },
  ],
};

export const findPageActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'success',
      label: 'Success',
      value: 'success',
      format: 'boolean',
    },
    {
      key: 'message',
      label: 'Message',
      value: 'message',
    },
    {
      key: 'searchTerm',
      label: 'Search Term',
      value: 'searchTerm',
    },
    {
      key: 'exactMatch',
      label: 'Exact Match',
      value: 'exactMatch',
      format: 'boolean',
    },
    {
      key: 'totalFound',
      label: 'Total Found',
      value: 'totalFound',
      format: 'number',
    },
    {
      key: 'returned',
      label: 'Returned',
      value: 'returned',
      format: 'number',
    },
    {
      key: 'pages',
      label: 'Pages',
      value: 'pages',
      listItems: [
        {
          key: 'title',
          label: 'Title',
          value: 'title',
        },
        {
          key: 'id',
          label: 'Page ID',
          value: 'id',
        },
        {
          key: 'url',
          label: 'URL',
          value: 'url',
          format: 'url',
        },
        {
          key: 'archived',
          label: 'Archived',
          value: 'archived',
          format: 'boolean',
        },
        {
          key: 'created_time',
          label: 'Created Time',
          value: 'created_time',
          format: 'datetime',
        },
        {
          key: 'last_edited_time',
          label: 'Last Edited Time',
          value: 'last_edited_time',
          format: 'datetime',
        },
        {
          key: 'parent_type',
          label: 'Parent Type',
          value: 'parent.type',
        },
        {
          key: 'database_id',
          label: 'Parent Database ID',
          value: 'parent.database_id',
        },
        {
          key: 'status',
          label: 'Status',
          value: 'properties.Status.status.name',
        },
      ],
    },
    {
      key: 'summary',
      label: 'Summary',
      value: 'summary',
      children: [
        {
          key: 'matchType',
          label: 'Match Type',
          value: 'matchType',
        },
        {
          key: 'totalFound',
          label: 'Total Found',
          value: 'totalFound',
          format: 'number',
        },
        {
          key: 'returned',
          label: 'Returned',
          value: 'returned',
          format: 'number',
        },
        {
          key: 'hasMore',
          label: 'Has More',
          value: 'hasMore',
          format: 'boolean',
        },
      ],
    },
  ],
};
