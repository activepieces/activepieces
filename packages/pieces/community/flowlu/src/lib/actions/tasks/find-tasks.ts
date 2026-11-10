import { createAction, Property } from '@activepieces/pieces-framework';
import { flowluAuth } from '../../auth';
import { makeClient } from '../../common';
import { flowluFind, flowluInput, flowluSharedProps } from '../../common/utils';
import { taskListOutputSchema } from '../../output-schemas';

export const findTasksAction = createAction({
  auth: flowluAuth,
  name: 'flowlu_find_tasks',
  classification: 'SEARCH',
  displayName: 'Find Tasks',
  description: 'Searches tasks.',
  audience: 'both',
  aiMetadata: {
    description:
      "Searches Flowlu tasks by text and optional filters for status, assignee and project, returning one page of tasks with has_more for paging. Use to find a task ID before reading, updating or deleting it, or to list a project's open tasks. Read-only and idempotent.",
    idempotent: true,
  },
  props: {
    search: flowluSharedProps.search(
      'Text to look for in task names and other text fields. Leave empty to list all.'
    ),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only tasks with this status. Leave empty for all.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'New', value: 1 },
          { label: 'In progress', value: 3 },
          { label: 'Pending owner approval', value: 4 },
          { label: 'Completed', value: 5 },
        ],
      },
    }),
    responsible_id: Property.ShortText({
      displayName: 'Assignee User ID',
      description:
        'Only tasks assigned to this user. Numeric user ID from List Users.',
      required: false,
    }),
    project_id: Property.ShortText({
      displayName: 'Project ID',
      description: 'Only tasks in this project. Numeric ID from Find Projects.',
      required: false,
    }),
    order: flowluSharedProps.order(),
    page: flowluSharedProps.page(),
    limit: flowluSharedProps.limit(),
  },
  outputSchema: taskListOutputSchema,
  async run(context) {
    const props = context.propsValue;
    const projectId = flowluInput.optionalId({
      value: props.project_id,
      name: 'Project ID',
    });
    return flowluFind.run({
      client: makeClient(context.auth),
      module: 'task',
      entity: 'tasks',
      props,
      filters: {
        'filter[status]': flowluInput.optionalNumber({
          value: props.status,
          name: 'Status',
        }),
        'filter[responsible_id]': flowluInput.optionalId({
          value: props.responsible_id,
          name: 'Assignee User ID',
        }),
        'filter[module]': projectId === undefined ? undefined : 'st',
        'filter[model]': projectId === undefined ? undefined : 'project',
        'filter[model_id]': projectId,
      },
    });
  },
});
