import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';

import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';
import { taskOutputSchema } from '../../output-schemas';

export const updateClickupTask = createAction({
  auth: clickupAuth,
  name: 'update_task',
  classification: 'WRITE',
  description: 'Change the name, details, status, priority or people on a task.',
  audience: 'human',
  aiMetadata: { description: 'Modify fields of an existing ClickUp task identified by its task ID, including name, description, status, priority, and adding or removing assignees. Pick this to change a task you already have the ID for; use Create Task to make a new one. Only the fields you supply are changed, so repeating the same update produces the same end state.', idempotent: false },
  displayName: 'Update Task',
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Task to Update',
      icon: 'inbox',
      props: ['workspace_id', 'space_id', 'list_id', 'task_id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'text',
      props: [
        'changes_info',
        'name',
        'description',
        'status_id',
        'priority_id',
      ],
    },
    {
      key: 'people',
      display: 'section',
      label: 'People',
      icon: 'users',
      props: ['add_assignee', 'rem_assignee'],
    },
  ],
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    changes_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      description: 'New name for the task.',
      displayName: 'Task Name',
      required: false,
    }),
    description: Property.LongText({
      description: 'New details for the task.',
      displayName: 'Description',
      required: false,
    }),
    status_id: clickupCommon.status_id(),
    priority_id: clickupCommon.priority_id(),
    add_assignee: clickupCommon.assignee_id(
      false,
      'Add Assignees',
      'People to add to the task.'
    ),
    rem_assignee: clickupCommon.assignee_id(
      false,
      'Remove Assignees',
      'People to take off the task.'
    ),
  },
  outputSchema: taskOutputSchema,
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
        ...(isSet(name) ? { name } : {}),
        ...(isSet(description) ? { description } : {}),
        ...(isSet(status_id) ? { status: status_id } : {}),
        ...(isSet(priority_id) ? { priority: priority_id } : {}),
        ...(hasEntries(add_assignee) || hasEntries(rem_assignee)
          ? {
              assignees: {
                add: add_assignee ?? [],
                rem: rem_assignee ?? [],
              },
            }
          : {}),
      }
    );

    return response.body;
  },
});

function isSet(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function hasEntries(values: unknown[] | null | undefined): boolean {
  return Array.isArray(values) && values.length > 0;
}
