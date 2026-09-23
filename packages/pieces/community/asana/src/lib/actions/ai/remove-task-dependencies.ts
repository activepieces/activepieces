import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaRemoveTaskDependenciesOutputSchema } from '../../output-schemas';

export const asanaRemoveTaskDependenciesAction = createAction({
  auth: asanaAuth,
  name: 'remove_task_dependencies',
  classification: 'WRITE',
  displayName: 'Remove Task Dependencies',
  description: 'Unlink dependency tasks from an Asana task (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unlinks the given dependency tasks from a task so it no longer waits on them; the tasks themselves are not changed or deleted. Read the current dependencies with List Task Dependencies. Needs a paid Asana plan; a free workspace gets a paid-plan error. Removing a link that is already gone converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaRemoveTaskDependenciesOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the blocked task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    dependencies: Property.Array({
      displayName: 'Dependency Task GIDs',
      description: 'Gids of the dependency tasks to unlink. Obtain them from List Task Dependencies.',
      required: true,
    }),
  },
  async run(context) {
    const task = context.propsValue.task.trim();
    const dependencies = asanaUtils.toStringArray(context.propsValue.dependencies);
    if (dependencies.length === 0) {
      throw new Error('Dependency Task GIDs must contain at least one task gid.');
    }
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/removeDependencies`,
      operation: 'Remove Task Dependencies',
      data: { dependencies },
    });
    return { success: true, task_gid: task, removed_dependency_gids: dependencies };
  },
});
