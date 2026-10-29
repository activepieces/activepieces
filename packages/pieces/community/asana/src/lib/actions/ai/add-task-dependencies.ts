import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaAddTaskDependenciesOutputSchema } from '../../output-schemas';

const MAX_DEPENDENCIES = 30;

export const asanaAddTaskDependenciesAction = createAction({
  auth: asanaAuth,
  name: 'add_task_dependencies',
  classification: 'WRITE',
  displayName: 'Add Task Dependencies',
  description: 'Mark other Asana tasks as dependencies that block a task (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Marks the given tasks as dependencies of a task, meaning the task is blocked until they are complete. A task can have at most 30 dependencies and dependents combined, so check List Task Dependencies first when it already has many. Undo with Remove Task Dependencies. Dependencies need a paid Asana plan; a free workspace gets a paid-plan error. Tasks that are already dependencies are left as they are, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaAddTaskDependenciesOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the blocked task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    dependencies: Property.Array({
      displayName: 'Dependency Task GIDs',
      description: `Gids of the tasks that must be completed first, at most ${MAX_DEPENDENCIES}.`,
      required: true,
    }),
  },
  async run(context) {
    const task = context.propsValue.task.trim();
    const dependencies = asanaUtils.toStringArray(context.propsValue.dependencies);
    if (dependencies.length === 0) {
      throw new Error('Dependency Task GIDs must contain at least one task gid.');
    }
    if (dependencies.length > MAX_DEPENDENCIES) {
      throw new Error(`Asana allows at most ${MAX_DEPENDENCIES} dependencies and dependents per task; got ${dependencies.length} gids.`);
    }
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/addDependencies`,
      operation: 'Add Task Dependencies',
      data: { dependencies },
    });
    return { success: true, task_gid: task, dependency_gids: dependencies };
  },
});
