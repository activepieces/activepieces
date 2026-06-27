import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import qs from 'qs';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';
import { ClickupTask } from '../../common/models';

export const clickupListListTasksAi = createAction({
  auth: clickupAuth,
  name: 'clickup_list_list_tasks',
  displayName: 'List List Tasks',
  description: 'Retrieves the tasks contained in a specific ClickUp list.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List the tasks of one specific ClickUp list (resolve the list ID via Get List or the List dropdown), with paging and ordering. Pick this when you know the target list and want only its tasks; to search tasks across the whole workspace use List Tasks. Read-only and idempotent; results are paginated (page starts at 0).',
    idempotent: true,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page to fetch (starts at 0).',
      required: false,
      defaultValue: 0,
    }),
    reverse: Property.Checkbox({
      displayName: 'Reverse',
      description: 'Tasks are displayed in reverse order.',
      required: false,
      defaultValue: false,
    }),
    include_closed: Property.Checkbox({
      displayName: 'Include Closed',
      description:
        'Include or exclude closed tasks. By default, they are excluded.',
      required: false,
      defaultValue: false,
    }),
    subtasks: Property.Checkbox({
      displayName: 'Include Subtasks',
      description: 'Include subtasks in the response.',
      required: false,
      defaultValue: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description:
        'Order by a particular field. By default, tasks are ordered by created.',
      required: false,
      options: {
        options: [
          { value: 'id', label: 'Id' },
          { value: 'created', label: 'Created at' },
          { value: 'updated', label: 'Last updated' },
          { value: 'due_date', label: 'Due date' },
        ],
      },
    }),
  },
  async run(configValue) {
    const { list_id, page, reverse, include_closed, subtasks, order_by } =
      configValue.propsValue;
    const auth = getAccessTokenOrThrow(configValue.auth);

    const query: Record<string, unknown> = {
      page,
      reverse,
      include_closed,
      subtasks,
      order_by,
    };

    return (
      await callClickUpApi<ClickupTask>(
        HttpMethod.GET,
        `list/${list_id}/task?${decodeURIComponent(qs.stringify(query))}`,
        auth,
        undefined,
        undefined,
        {
          'Content-Type': 'application/json',
        }
      )
    ).body;
  },
});
