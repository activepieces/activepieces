import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaJobOutputSchema } from '../../output-schemas';

const INCLUDE_OPTIONS = [
  { label: 'Assignee', value: 'assignee' },
  { label: 'Attachments', value: 'attachments' },
  { label: 'Dates', value: 'dates' },
  { label: 'Dependencies', value: 'dependencies' },
  { label: 'Followers', value: 'followers' },
  { label: 'Description (notes)', value: 'notes' },
  { label: 'Parent task', value: 'parent' },
  { label: 'Projects', value: 'projects' },
  { label: 'Subtasks', value: 'subtasks' },
  { label: 'Tags', value: 'tags' },
];

export const asanaDuplicateTaskAction = createAction({
  auth: asanaAuth,
  name: 'duplicate_task',
  classification: 'WRITE',
  displayName: 'Duplicate Task',
  description: 'Start copying an Asana task into a new task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an asynchronous copy of a task and returns a job (gid, status, new_task). The copy may not be finished yet: poll Get Job with the returned job gid until status is succeeded. Choose which parts to copy with Include. Each call starts a new copy, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaJobOutputSchema,
  props: {
    task: Property.ShortText({
      displayName: 'Task GID',
      description: 'Gid of the task to copy. Obtain it from List Project Tasks or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Task Name',
      description: 'Name of the new task, for example "Copy of Draft launch email".',
      required: true,
    }),
    include: Property.StaticMultiSelectDropdown({
      displayName: 'Include',
      description: 'Parts of the original task to copy. Leave empty to copy only the name.',
      required: false,
      options: { disabled: false, options: INCLUDE_OPTIONS },
    }),
  },
  async run(context) {
    const { task, name, include } = context.propsValue;
    const includeList = asanaUtils.toStringArray(include);
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/tasks/${asanaUtils.pathSegment(task)}/duplicate`,
      operation: 'Duplicate Task',
      query: { opt_fields: ASANA_FIELDS.job },
      data: {
        name,
        ...(includeList.length > 0 ? { include: includeList.join(',') } : {}),
      },
    });
  },
});
