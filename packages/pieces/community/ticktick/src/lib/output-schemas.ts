import { OutputSchema } from '@activepieces/pieces-framework';

export const ticktickAddTaskCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'number' },
    { key: 'createdTime', label: 'Created Time', format: 'number' },
  ],
};

export const ticktickAssignTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'startDate', label: 'Start Date', format: 'datetime' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'assigneeUsername', label: 'Assignee Username', format: 'email' },
    { key: 'kind', label: 'Kind' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  ],
};

export const ticktickBatchSaveTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'savedCount', label: 'Saved Count', format: 'number' },
    {
      key: 'id2etag',
      label: 'Task ID to Etag',
      dynamicKey: true,
    },
    { key: 'failed', label: 'Failed' },
  ],
};

export const ticktickCheckinHabitOutputSchema: OutputSchema = {
  fields: [
    { key: 'habitId', label: 'Habit ID' },
    {
      key: 'checkins',
      label: 'Checkins',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'stamp', label: 'Stamp', format: 'number' },
        { key: 'time', label: 'Time' },
        { key: 'opTime', label: 'Op Time' },
        { key: 'value', label: 'Value', format: 'number' },
        { key: 'goal', label: 'Goal', format: 'number' },
        { key: 'status', label: 'Status' },
      ],
    },
  ],
};

export const ticktickCompleteTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'completedTaskIds', label: 'Completed Task IDs' },
    { key: 'completedCount', label: 'Completed Count', format: 'number' },
    { key: 'notCompletedTaskIds', label: 'Not Completed Task IDs' },
  ],
};

export const ticktickCompleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const ticktickListCountdownsOutputSchema: OutputSchema = {
  fields: [
    { key: 'countdowns', label: 'Countdowns' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickCreateColumnOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'name', label: 'Name' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
  ],
};

export const ticktickCreateFocusOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'userId', label: 'User ID', format: 'number' },
    { key: 'type', label: 'Type', format: 'number' },
    { key: 'note', label: 'Note' },
    {
      key: 'tasks',
      label: 'Tasks',
      listItems: [
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        { key: 'endTime', label: 'End Time', format: 'datetime' },
      ],
    },
    { key: 'startTime', label: 'Start Time', format: 'datetime' },
    { key: 'endTime', label: 'End Time', format: 'datetime' },
    { key: 'pauseDuration', label: 'Pause Duration', format: 'number' },
    { key: 'added', label: 'Added', format: 'boolean' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'duration', label: 'Duration', format: 'number' },
    { key: 'relationType', label: 'Relation Type' },
  ],
};

export const ticktickCreateProjectGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'showAll', label: 'Show All', format: 'boolean' },
  ],
};

export const ticktickCreateHabitOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'totalCheckIns', label: 'Total Check Ins', format: 'number' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'type', label: 'Type' },
    { key: 'goal', label: 'Goal', format: 'number' },
    { key: 'step', label: 'Step', format: 'number' },
    { key: 'unit', label: 'Unit' },
    { key: 'repeatRule', label: 'Repeat Rule' },
    { key: 'completedCycles', label: 'Completed Cycles', format: 'number' },
  ],
};

export const ticktickCreateProjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'viewMode', label: 'View Mode' },
    { key: 'kind', label: 'Kind' },
  ],
};

export const ticktickCreateTagOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'label', label: 'Label' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'type', label: 'Type', format: 'number' },
  ],
};

export const ticktickCreateTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'startDate', label: 'Start Date', format: 'datetime' },
    { key: 'dueDate', label: 'Due Date', format: 'datetime' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'kind', label: 'Kind' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  ],
};

export const ticktickDeleteTaskCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'taskId', label: 'Task ID' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const ticktickDeleteProjectGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'projectGroupId', label: 'Project Group ID' },
  ],
};

export const ticktickDeleteProjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'projectId', label: 'Project ID' },
  ],
};

export const ticktickListHabitSectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'sections', label: 'Sections' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListHabitCheckinsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'checkins',
      label: 'Checkins',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'habitId', label: 'Habit ID' },
        { key: 'year', label: 'Year', format: 'number' },
        {
          key: 'checkins',
          label: 'Checkins',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'stamp', label: 'Stamp', format: 'number' },
            { key: 'time', label: 'Time' },
            { key: 'opTime', label: 'Op Time', format: 'datetime' },
            { key: 'value', label: 'Value', format: 'number' },
            { key: 'goal', label: 'Goal', format: 'number' },
            { key: 'status', label: 'Status' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'name', label: 'Name' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListTaskCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'userId', label: 'User ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'number' },
        { key: 'createdTime', label: 'Created Time', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListCompletedTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'completedTime', label: 'Completed Time', format: 'datetime' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'kind', label: 'Kind' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'content', label: 'Content' },
        { key: 'startDate', label: 'Start Date', format: 'datetime' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'tags', label: 'Tags' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListFocusesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'focuses',
      label: 'Focuses',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'userId', label: 'User ID', format: 'number' },
        { key: 'type', label: 'Type', format: 'number' },
        { key: 'note', label: 'Note' },
        {
          key: 'tasks',
          label: 'Tasks',
          listItems: [
            { key: 'startTime', label: 'Start Time', format: 'datetime' },
            { key: 'endTime', label: 'End Time', format: 'datetime' },
          ],
        },
        { key: 'startTime', label: 'Start Time', format: 'datetime' },
        { key: 'endTime', label: 'End Time', format: 'datetime' },
        { key: 'pauseDuration', label: 'Pause Duration', format: 'number' },
        { key: 'added', label: 'Added', format: 'boolean' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'duration', label: 'Duration', format: 'number' },
        { key: 'relationType', label: 'Relation Type' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListProjectGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'showAll', label: 'Show All', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListHabitsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'habits',
      label: 'Habits',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'totalCheckIns', label: 'Total Check Ins', format: 'number' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'type', label: 'Type' },
        { key: 'goal', label: 'Goal', format: 'number' },
        { key: 'step', label: 'Step', format: 'number' },
        { key: 'unit', label: 'Unit' },
        { key: 'repeatRule', label: 'Repeat Rule' },
        { key: 'recordEnable', label: 'Record Enable', format: 'boolean' },
        { key: 'completedCycles', label: 'Completed Cycles', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'tags', label: 'Tags' },
        { key: 'kind', label: 'Kind' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'content', label: 'Content' },
        { key: 'startDate', label: 'Start Date', format: 'datetime' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickListProjectMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      labelKey: 'displayName',
      listItems: [
        { key: 'username', label: 'Username', format: 'email' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'self', label: 'Self', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickMoveTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'moved',
      label: 'Moved',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickGetUserPreferencesOutputSchema: OutputSchema = {
  fields: [
    { key: 'timeZone', label: 'Time Zone' },
  ],
};

export const ticktickGetProjectDataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'project',
      label: 'Project',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'viewMode', label: 'View Mode' },
        { key: 'kind', label: 'Kind' },
      ],
    },
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'startDate', label: 'Start Date', format: 'datetime' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'tags', label: 'Tags' },
        { key: 'kind', label: 'Kind' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
      ],
    },
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'name', label: 'Name' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
      ],
    },
  ],
};

export const ticktickSearchTasksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'startDate', label: 'Start Date', format: 'datetime' },
        { key: 'dueDate', label: 'Due Date', format: 'datetime' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'tags', label: 'Tags' },
        { key: 'kind', label: 'Kind' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const newTaskCreatedOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'kind', label: 'Kind' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  ],
};

export const ticktickListTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const ticktickUpdateProjectGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'showAll', label: 'Show All', format: 'boolean' },
  ],
};

export const ticktickListProjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'viewMode', label: 'View Mode' },
        { key: 'kind', label: 'Kind' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const createTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'tags', label: 'Tags' },
    { key: 'kind', label: 'Kind' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  ],
};

export const findTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Result',
      labelKey: 'title',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'projectId', label: 'Project ID' },
        { key: 'sortOrder', label: 'Sort Order', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'content', label: 'Content' },
        { key: 'timeZone', label: 'Time Zone' },
        { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'kind', label: 'Kind' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
      ],
    },
  ],
};

export const getProjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'viewMode', label: 'View Mode' },
    { key: 'kind', label: 'Kind' },
  ],
};

export const updateTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'projectId', label: 'Project ID' },
    { key: 'sortOrder', label: 'Sort Order', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'content', label: 'Content' },
    { key: 'timeZone', label: 'Time Zone' },
    { key: 'isAllDay', label: 'Is All Day', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'isFloating', label: 'Is Floating', format: 'boolean' },
    { key: 'status', label: 'Status', format: 'number' },
    { key: 'kind', label: 'Kind' },
    { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
    { key: 'createdTime', label: 'Created Time', format: 'datetime' },
  ],
};
