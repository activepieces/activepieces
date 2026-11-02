import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskTagChangeOutputSchema } from '../../output-schemas';

export const asanaRemoveTagFromTaskAction = createAction({
  auth: asanaAuth,
  name: 'remove_tag_from_task',
  classification: 'WRITE',
  displayName: 'Remove Tag from Task',
  description: 'Take a tag off an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one tag from one task; the tag itself and its other tasks are unaffected (use Delete Tag to delete the tag everywhere). Removing a tag the task does not have converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskTagChangeOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    tag: Property.ShortText({
      displayName: 'Tag GID',
      description: 'Gid of the tag to remove. Obtain it from List Task Tags.',
      required: true,
    }),
  },
  async run(context) {
    const { task, tag } = context.propsValue;
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/removeTag`,
      operation: 'Remove Tag from Task',
      data: { tag: tag.trim() },
    });
    return { success: true, task_gid: task.trim(), tag_gid: tag.trim() };
  },
});
