import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTasks, googleTasksCommon } from '../common';
import { googleTasksAuth } from '../auth';

export const googleTasksFindTasksAction = createAction({
  auth: googleTasksAuth,
  name: 'find_tasks',
  displayName: 'Find Tasks',
  description: 'Search and list tasks in a task list with optional date-range and status filters.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List tasks in a task list, filtered by due/completed/updated date ranges and status. The piece is otherwise write-only — call this first to find a task\'s id before completing, updating, or deleting it. Read-only.',
    idempotent: true,
  },
  props: {
    tasks_list: googleTasksCommon.tasksList,
    show_completed: Property.Checkbox({
      displayName: 'Show Completed',
      description: 'Include completed tasks in results. Defaults to true.',
      required: false,
      defaultValue: true,
    }),
    show_hidden: Property.Checkbox({
      displayName: 'Show Hidden',
      description: 'Include hidden tasks (tasks that have been completed and a day has passed). Defaults to false.',
      required: false,
      defaultValue: false,
    }),
    due_min: Property.DateTime({
      displayName: 'Due Date From',
      description:
        'Return tasks due on or after this date. RFC 3339 timestamp, e.g. 2026-06-01T00:00:00Z.',
      required: false,
    }),
    due_max: Property.DateTime({
      displayName: 'Due Date To',
      description:
        'Return tasks due before this date (exclusive). RFC 3339 timestamp, e.g. 2026-07-01T00:00:00Z.',
      required: false,
    }),
    completed_min: Property.DateTime({
      displayName: 'Completed Date From',
      description:
        'Return tasks completed on or after this date. RFC 3339 timestamp.',
      required: false,
    }),
    completed_max: Property.DateTime({
      displayName: 'Completed Date To',
      description:
        'Return tasks completed before this date (exclusive). RFC 3339 timestamp.',
      required: false,
    }),
    updated_min: Property.DateTime({
      displayName: 'Updated Since',
      description:
        'Return tasks last modified on or after this date. Useful for "since last run" incremental reads. RFC 3339 timestamp.',
      required: false,
    }),
    max_results: Property.Number({
      displayName: 'Max Results',
      description:
        'Maximum number of tasks to return (1–100). Defaults to 20 when omitted.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const authProp = auth as OAuth2PropertyValue;
    const params: Record<string, string | number | boolean> = {};

    if (propsValue.show_completed !== undefined && propsValue.show_completed !== null) {
      params['showCompleted'] = propsValue.show_completed;
    }
    if (propsValue.show_hidden !== undefined && propsValue.show_hidden !== null) {
      params['showHidden'] = propsValue.show_hidden;
    }
    if (propsValue.due_min) {
      params['dueMin'] = new Date(propsValue.due_min).toISOString();
    }
    if (propsValue.due_max) {
      params['dueMax'] = new Date(propsValue.due_max).toISOString();
    }
    if (propsValue.completed_min) {
      params['completedMin'] = new Date(propsValue.completed_min).toISOString();
    }
    if (propsValue.completed_max) {
      params['completedMax'] = new Date(propsValue.completed_max).toISOString();
    }
    if (propsValue.updated_min) {
      params['updatedMin'] = new Date(propsValue.updated_min).toISOString();
    }
    if (propsValue.max_results) {
      params['maxResults'] = propsValue.max_results;
    }

    const tasks = await getTasks(authProp, propsValue.tasks_list!, params);

    return {
      tasks,
      count: tasks.length,
    };
  },
});
