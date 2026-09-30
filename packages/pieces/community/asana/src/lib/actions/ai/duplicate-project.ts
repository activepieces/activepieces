import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaJobOutputSchema } from '../../output-schemas';

const INCLUDE_OPTIONS = [
  { label: 'Members', value: 'members' },
  { label: 'Project description (notes)', value: 'notes' },
  { label: 'Forms', value: 'forms' },
  { label: 'Permissions', value: 'permissions' },
  { label: 'Allocations', value: 'allocations' },
  { label: 'Task assignees', value: 'task_assignee' },
  { label: 'Task attachments', value: 'task_attachments' },
  { label: 'Task dates', value: 'task_dates' },
  { label: 'Task dependencies', value: 'task_dependencies' },
  { label: 'Task followers', value: 'task_followers' },
  { label: 'Task descriptions', value: 'task_notes' },
  { label: 'Task other projects', value: 'task_projects' },
  { label: 'Task subtasks', value: 'task_subtasks' },
  { label: 'Task tags', value: 'task_tags' },
  { label: 'Task templates', value: 'task_templates' },
  { label: 'Default task type', value: 'task_type_default' },
];

export const asanaDuplicateProjectAction = createAction({
  auth: asanaAuth,
  name: 'duplicate_project',
  classification: 'WRITE',
  displayName: 'Duplicate Project',
  description: 'Start copying an Asana project into a new project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an asynchronous copy of a project (tasks, views and rules are always copied) and returns a job (gid, status, new_project). The copy may not be finished yet: poll Get Job with the returned job gid until status is succeeded. Choose extra parts with Include. Each call starts a new copy, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaJobOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project to copy. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Project Name',
      description: 'Name of the new project, for example "Q1 Launch".',
      required: true,
    }),
    include: Property.StaticMultiSelectDropdown({
      displayName: 'Include',
      description: 'Optional parts to copy in addition to tasks, views and rules.',
      required: false,
      options: { disabled: false, options: INCLUDE_OPTIONS },
    }),
  },
  async run(context) {
    const { project, name, include } = context.propsValue;
    const includeList = asanaUtils.toStringArray(include);
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/duplicate`,
      operation: 'Duplicate Project',
      query: { opt_fields: ASANA_FIELDS.job },
      data: {
        name,
        ...(includeList.length > 0 ? { include: includeList.join(',') } : {}),
      },
    });
  },
});
