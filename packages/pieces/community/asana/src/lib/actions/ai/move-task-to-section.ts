import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaMoveTaskToSectionOutputSchema } from '../../output-schemas';

export const asanaMoveTaskToSectionAction = createAction({
  auth: asanaAuth,
  name: 'move_task_to_section',
  classification: 'WRITE',
  displayName: 'Move Task to Section',
  description: 'Move a task into a section of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Puts a task into a section (list heading or board column), removing it from its other sections in that project; it goes to the top unless you place it before or after another task. Use Add Task to Project to put a task into another project. Repeating the same move converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaMoveTaskToSectionOutputSchema,
  props: {
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the target section. Obtain it from List Sections.',
      required: true,
    }),
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to move. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Task',
      description: 'Gid of a task in the section to place this task before. Cannot be combined with Insert After Task.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Task',
      description: 'Gid of a task in the section to place this task after. Cannot be combined with Insert Before Task.',
      required: false,
    }),
  },
  async run(context) {
    const { section, task, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({
      first: insert_before,
      second: insert_after,
      firstLabel: 'Insert Before Task',
      secondLabel: 'Insert After Task',
    });
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/sections/${asanaUtils.pathSegment(section)}/addTask`,
      operation: 'Move Task to Section',
      data: {
        task: task.trim(),
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
    return { success: true, section_gid: section.trim(), task_gid: task.trim() };
  },
});
