import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskProjectChangeOutputSchema } from '../../output-schemas';

export const asanaAddTaskToProjectAction = createAction({
  auth: asanaAuth,
  name: 'add_task_to_project',
  classification: 'WRITE',
  displayName: 'Add Task to Project',
  description: 'Add an existing task to another Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds an existing task to a project (a task can live in several projects), optionally into a section or next to another task; also reorders a task already in the project. Use Move Task to Section to move it between sections of one project. Adding it again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskProjectChangeOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project to add the task to. Obtain it from List Projects.',
      required: true,
    }),
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of a section in that project to put the task in (at the bottom). Obtain it from List Sections.',
      required: false,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Task',
      description: 'Gid of a task in the project to place this task before. Cannot be combined with Insert After Task.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Task',
      description: 'Gid of a task in the project to place this task after. Cannot be combined with Insert Before Task.',
      required: false,
    }),
  },
  async run(context) {
    const { task, project, section, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({
      first: insert_before,
      second: insert_after,
      firstLabel: 'Insert Before Task',
      secondLabel: 'Insert After Task',
    });
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/addProject`,
      operation: 'Add Task to Project',
      data: {
        project: project.trim(),
        ...(asanaUtils.hasValue(section) ? { section: String(section).trim() } : {}),
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
    return { success: true, task_gid: task.trim(), project_gid: project.trim() };
  },
});
