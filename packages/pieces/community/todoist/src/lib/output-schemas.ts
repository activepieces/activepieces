import { OutputSchema } from '@activepieces/pieces-framework';

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'content', label: 'Content' },
  { key: 'description', label: 'Description' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'section_id', label: 'Section ID' },
  { key: 'parent_id', label: 'Parent Task ID' },
  { key: 'labels', label: 'Labels' },
  { key: 'priority', label: 'Priority', format: 'number' },
  {
    key: 'due',
    label: 'Due',
    children: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'string', label: 'Human-Readable Date' },
      { key: 'is_recurring', label: 'Is Recurring', format: 'boolean' },
      { key: 'timezone', label: 'Timezone' },
    ],
  },
  { key: 'checked', label: 'Completed', format: 'boolean' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
  { key: 'added_at', label: 'Added At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'added_by_uid', label: 'Added By User ID' },
  { key: 'completed_by_uid', label: 'Completed By User ID' },
  { key: 'responsible_uid', label: 'Assigned To User ID' },
];

export const createTaskActionOutputSchema: OutputSchema = { fields: taskFields };
export const getTaskActionOutputSchema: OutputSchema = { fields: taskFields };
export const findTaskActionOutputSchema: OutputSchema = { fields: taskFields };
export const updateTaskActionOutputSchema: OutputSchema = { fields: taskFields };
export const moveTaskActionOutputSchema: OutputSchema = { fields: taskFields };
export const quickAddTaskActionOutputSchema: OutputSchema = { fields: taskFields };

export const filterTasksActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      value: 'tasks',
      labelKey: 'content',
      listItems: taskFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listCompletedTasksActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      value: 'tasks',
      labelKey: 'content',
      listItems: taskFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listCompletedTasksByDueDateActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      value: 'tasks',
      labelKey: 'content',
      listItems: taskFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listActivityLogActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      value: 'events',
      labelKey: 'event_type',
      listItems: [
        { key: 'id', label: 'Event ID' },
        { key: 'event_type', label: 'Event Type' },
        { key: 'event_date', label: 'Event Date', format: 'datetime' },
        { key: 'object_type', label: 'Object Type' },
        { key: 'object_id', label: 'Object ID' },
        { key: 'parent_project_id', label: 'Parent Project ID' },
        { key: 'parent_item_id', label: 'Parent Task ID' },
        { key: 'initiator_id', label: 'Initiator User ID' },
        { key: 'extra_data', label: 'Extra Data' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'color', label: 'Color' },
  { key: 'parent_id', label: 'Parent Project ID' },
  { key: 'view_style', label: 'View Style' },
  { key: 'inbox_project', label: 'Is Inbox', format: 'boolean' },
  { key: 'is_favorite', label: 'Is Favorite', format: 'boolean' },
  { key: 'is_archived', label: 'Is Archived', format: 'boolean' },
  { key: 'is_shared', label: 'Is Shared', format: 'boolean' },
  { key: 'creator_uid', label: 'Creator User ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const createProjectActionOutputSchema: OutputSchema = { fields: projectFields };
export const getProjectActionOutputSchema: OutputSchema = { fields: projectFields };
export const updateProjectActionOutputSchema: OutputSchema = { fields: projectFields };

export const listProjectsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      value: 'projects',
      labelKey: 'name',
      listItems: projectFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const searchProjectsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      value: 'projects',
      labelKey: 'name',
      listItems: projectFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listArchivedProjectsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      value: 'projects',
      labelKey: 'name',
      listItems: projectFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const sectionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Section ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'section_order', label: 'Order', format: 'number' },
  { key: 'is_archived', label: 'Is Archived', format: 'boolean' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
  { key: 'added_at', label: 'Added At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
];

export const createSectionActionOutputSchema: OutputSchema = { fields: sectionFields };
export const getSectionActionOutputSchema: OutputSchema = { fields: sectionFields };
export const updateSectionActionOutputSchema: OutputSchema = { fields: sectionFields };

export const listSectionsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sections',
      label: 'Sections',
      value: 'sections',
      labelKey: 'name',
      listItems: sectionFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const searchSectionsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sections',
      label: 'Sections',
      value: 'sections',
      labelKey: 'name',
      listItems: sectionFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listArchivedSectionsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sections',
      label: 'Sections',
      value: 'sections',
      labelKey: 'name',
      listItems: sectionFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const labelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Label ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'order', label: 'Order', format: 'number' },
  { key: 'is_favorite', label: 'Is Favorite', format: 'boolean' },
];

export const createLabelActionOutputSchema: OutputSchema = { fields: labelFields };
export const getLabelActionOutputSchema: OutputSchema = { fields: labelFields };
export const updateLabelActionOutputSchema: OutputSchema = { fields: labelFields };

export const listLabelsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      value: 'labels',
      labelKey: 'name',
      listItems: labelFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const searchLabelsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      value: 'labels',
      labelKey: 'name',
      listItems: labelFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listSharedLabelsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'shared_labels', label: 'Shared Labels', value: 'shared_labels' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'content', label: 'Content' },
  { key: 'item_id', label: 'Task ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'posted_uid', label: 'Posted By User ID' },
  { key: 'posted_at', label: 'Posted At', format: 'datetime' },
  { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
  { key: 'file_attachment', label: 'File Attachment' },
];

export const createTaskCommentActionOutputSchema: OutputSchema = { fields: commentFields };
export const createProjectCommentActionOutputSchema: OutputSchema = { fields: commentFields };
export const getCommentActionOutputSchema: OutputSchema = { fields: commentFields };

export const listCommentsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      value: 'comments',
      labelKey: 'content',
      listItems: commentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getCurrentUserActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'lang', label: 'Language' },
    { key: 'inbox_project_id', label: 'Inbox Project ID' },
    { key: 'karma', label: 'Karma', format: 'number' },
    { key: 'karma_trend', label: 'Karma Trend' },
    { key: 'is_premium', label: 'Is Premium', format: 'boolean' },
    { key: 'premium_status', label: 'Premium Status' },
    { key: 'mfa_enabled', label: 'MFA Enabled', format: 'boolean' },
    { key: 'daily_goal', label: 'Daily Goal', format: 'number' },
    { key: 'weekly_goal', label: 'Weekly Goal', format: 'number' },
    { key: 'completed_count', label: 'Total Completed Count', format: 'number' },
    { key: 'completed_today', label: 'Completed Today', format: 'number' },
    { key: 'joined_at', label: 'Joined At', format: 'datetime' },
    {
      key: 'tz_info',
      label: 'Timezone',
      children: [
        { key: 'timezone', label: 'Timezone Name' },
        { key: 'gmt_string', label: 'GMT Offset' },
      ],
    },
  ],
};

export const getProductivityStatsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'completed_count', label: 'Total Completed Count', format: 'number' },
    { key: 'karma', label: 'Karma', format: 'number' },
    { key: 'karma_trend', label: 'Karma Trend' },
    { key: 'karma_last_update', label: 'Karma Last Update', format: 'number' },
    {
      key: 'goals',
      label: 'Goals',
      children: [
        { key: 'daily_goal', label: 'Daily Goal', format: 'number' },
        { key: 'weekly_goal', label: 'Weekly Goal', format: 'number' },
        {
          key: 'current_daily_streak',
          label: 'Current Daily Streak',
          children: [
            { key: 'count', label: 'Count', format: 'number' },
            { key: 'start', label: 'Start', format: 'date' },
            { key: 'end', label: 'End', format: 'date' },
          ],
        },
        {
          key: 'current_weekly_streak',
          label: 'Current Weekly Streak',
          children: [
            { key: 'count', label: 'Count', format: 'number' },
            { key: 'start', label: 'Start', format: 'date' },
            { key: 'end', label: 'End', format: 'date' },
          ],
        },
      ],
    },
    {
      key: 'days_items',
      label: 'Daily Breakdown',
      labelKey: 'date',
      listItems: [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'total_completed', label: 'Total Completed', format: 'number' },
      ],
    },
    {
      key: 'week_items',
      label: 'Weekly Breakdown',
      labelKey: 'from',
      listItems: [
        { key: 'from', label: 'From', format: 'date' },
        { key: 'to', label: 'To', format: 'date' },
        { key: 'total_completed', label: 'Total Completed', format: 'number' },
      ],
    },
    {
      key: 'karma_graph_data',
      label: 'Karma Graph',
      labelKey: 'date',
      listItems: [
        { key: 'date', label: 'Date', format: 'date' },
        { key: 'karma_avg', label: 'Karma Average', format: 'number' },
      ],
    },
    { key: 'project_colors', label: 'Project Colors', dynamicKey: true },
  ],
};

export const taskCompletedTriggerOutputSchema: OutputSchema = { fields: taskFields };
