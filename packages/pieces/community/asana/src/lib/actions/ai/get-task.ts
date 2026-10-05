import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaGetTaskOutputSchema } from '../../output-schemas';

export const asanaGetTaskAction = createAction({
  auth: asanaAuth,
  name: 'get_task',
  classification: 'READ',
  displayName: 'Get Task',
  description: 'Get the details of an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one task by gid with its name, description, completion, dates, assignee, parent, projects and sections, tags, followers and link. Use it to read the current state before Update Task, or to inspect a task found by a list or search action. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaGetTaskOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task, for example 1204567890123456. Obtain it from List Project Tasks, List Assigned Tasks or Search Workspace Objects.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/tasks/${asanaUtils.pathSegment(context.propsValue.task)}`,
      operation: 'Get Task',
      query: { opt_fields: ASANA_FIELDS.task },
    });
  },
});
