import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTaskOutputSchema } from '../../output-schemas';

const NO_PARENT = 'none';

export const asanaSetTaskParentAction = createAction({
  auth: asanaAuth,
  name: 'set_task_parent',
  classification: 'WRITE',
  displayName: 'Set Task Parent',
  description: 'Make a task a subtask of another task, or detach it from its parent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves an existing task under a new parent task (making it a subtask), or detaches it to top level when Parent is "none". Optionally positions it before or after a sibling subtask. Setting the same parent again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to move. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    parent: Property.ShortText({
      displayName: 'Parent Task GID',
      description: 'Gid of the new parent task, or "none" to remove the current parent.',
      required: true,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Subtask',
      description: 'Gid of an existing subtask of the new parent to place this task before. Cannot be combined with Insert After Subtask.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Subtask',
      description: 'Gid of an existing subtask of the new parent to place this task after. Cannot be combined with Insert Before Subtask.',
      required: false,
    }),
  },
  async run(context) {
    const { task, parent, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({
      first: insert_before,
      second: insert_after,
      firstLabel: 'Insert Before Subtask',
      secondLabel: 'Insert After Subtask',
    });
    const trimmedParent = parent.trim();
    const parentValue = trimmedParent.toLowerCase() === NO_PARENT ? null : trimmedParent;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/setParent`,
      operation: 'Set Task Parent',
      query: { opt_fields: ASANA_FIELDS.task },
      data: {
        parent: parentValue,
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
  },
});
