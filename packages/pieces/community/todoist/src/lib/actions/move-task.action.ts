import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistAuth } from '../..';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistMoveTaskAction = createAction({
  auth: todoistAuth,
  name: 'todoist_move_task',
  displayName: 'Move Task',
  description: 'Move a task to a different project, section, or parent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reparents a Todoist task to a different project, section, or parent task. Provide task_id plus at least one destination (project, section, or parent). Use this to relocate a task — Update Task cannot change a task\'s project or section. All IDs must be the 16-character base32 form returned by Find Task / Filter Tasks. Idempotent: moving to the same destination is a no-op.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task to move (obtain from Find Task or Filter Tasks).',
      required: true,
    }),
    project_id: Property.ShortText({
      displayName: 'Destination Project ID',
      description: 'Move the task into this project. 16-character base32 ID from List Projects. Provide at least one of project, section, or parent.',
      required: false,
    }),
    section_id: Property.ShortText({
      displayName: 'Destination Section ID',
      description: 'Move the task into this section. 16-character base32 ID from List Sections. Provide at least one of project, section, or parent.',
      required: false,
    }),
    parent_id: Property.ShortText({
      displayName: 'Parent Task ID',
      description: 'Make the task a sub-task of this parent task. 16-character base32 ID. Provide at least one of project, section, or parent.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { task_id, project_id, section_id, parent_id } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');

    if (!project_id && !section_id && !parent_id) {
      throw new Error(
        'Move Task requires at least one destination: project_id, section_id, or parent_id.',
      );
    }

    return await todoistRestClient.tasks.move({
      token,
      task_id,
      project_id,
      section_id,
      parent_id,
    });
  },
});
