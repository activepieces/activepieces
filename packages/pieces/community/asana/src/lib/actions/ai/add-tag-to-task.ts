import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskTagChangeOutputSchema } from '../../output-schemas';

export const asanaAddTagToTaskAction = createAction({
  auth: asanaAuth,
  name: 'add_tag_to_task',
  classification: 'WRITE',
  displayName: 'Add Tag to Task',
  description: 'Apply a tag to an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Applies an existing tag to a task, by tag gid (resolve a name with List Tags or Search Workspace Objects, or make a new tag with Create Tag). Applying a tag the task already has converges, so it is safe to retry.',
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
      description: 'Gid of the tag to apply. Obtain it from List Tags or Search Workspace Objects (object type tag).',
      required: true,
    }),
  },
  async run(context) {
    const { task, tag } = context.propsValue;
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/addTag`,
      operation: 'Add Tag to Task',
      data: { tag: tag.trim() },
    });
    return { success: true, task_gid: task.trim(), tag_gid: tag.trim() };
  },
});
