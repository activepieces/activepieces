import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const updateClickupTask = createAction({
  auth: clickupAuth,
  name: 'update_task',
  description: 'Update task in a ClickUp workspace and list',
  audience: 'both',
  aiMetadata: { description: 'Modify fields of an existing ClickUp task identified by its task ID, including name, description, status, priority, and adding or removing assignees. Pick this to change a task you already have the ID for; use Create Task to make a new one. Only the fields you supply are changed, so repeating the same update produces the same end state.', idempotent: false },
  displayName: 'Update Task',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    name: Property.ShortText({
      description: 'The name of the task to update',
      displayName: 'Task Name',
      required: false,
    }),
    description: Property.LongText({
      description: 'The description of the task to update',
      displayName: 'Task Description',
      required: false,
    }),
    status_id: clickupCommon.status_id(),
    priority_id: clickupCommon.priority_id(),
    add_assignee: clickupCommon.assignee_id(
      false,
      'Add Assignees',
      'assignee(s) you want to add for the task'
    ),
    rem_assignee: clickupCommon.assignee_id(
      false,
      'Remove Assignees',
      'assignee(s) you want to remove from the task'
    ),
  },
  async run(configValue) {
    const {
      task_id,
      name,
      description,
      status_id,
      priority_id,
      add_assignee,
      rem_assignee,
    } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.PUT,
      `task/${task_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {
        name: name,
        description: description,
        status: status_id,
        priority: priority_id,
        assignees: {
          add: add_assignee,
          rem: rem_assignee,
        },
      }
    );

    return response.body;
  },
});
