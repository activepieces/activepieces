import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskProjectChangeOutputSchema } from '../../output-schemas';

export const asanaRemoveTaskFromProjectAction = createAction({
  auth: asanaAuth,
  name: 'remove_task_from_project',
  classification: 'WRITE',
  displayName: 'Remove Task from Project',
  description: 'Remove a task from one of its Asana projects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a task from one project without deleting it; the task stays in its other projects (or becomes project-less) and can be added back with Add Task to Project, though its section position is lost. Use Delete Task to delete it. Removing it again converges, so it is safe to retry.',
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
      description: 'Gid of the project to remove the task from. Obtain it from List Task Projects.',
      required: true,
    }),
  },
  async run(context) {
    const { task, project } = context.propsValue;
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/removeProject`,
      operation: 'Remove Task from Project',
      data: { project: project.trim() },
    });
    return { success: true, task_gid: task.trim(), project_gid: project.trim() };
  },
});
