import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import qs from 'qs';
import { clickupAuth } from '../../..';
import { callClickUpApi, clickupCommon, listTags } from '../../common';
import { ClickupTask } from '../../common/models';

export const filterClickupWorkspaceTasks = createAction({
  auth: clickupAuth,
  name: 'list_workspace_tasks',
  displayName: 'List Team Tasks',
  description:
    'Retrieves the tasks that meet specific criteria from a Workspace.',
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(false, true),
    folder_id: clickupCommon.folder_id(false, true),
    list_id: clickupCommon.list_id(false, true),

    assignees: clickupCommon.assignee_id(
      false,
      'Assignee Id',
      'ID of assignee for Clickup Task'
    ),
    tags: Property.MultiSelectDropdown({
      displayName: 'Tags',
      description: 'The tags to filter for',
      refreshers: ['space_id', 'workspace_id'],
      required: false,
      options: async ({ auth, workspace_id, space_id }) => {
        if (!auth || !workspace_id || !space_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace and space',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth as OAuth2PropertyValue);
        const response = await listTags(accessToken, space_id as string);
        return {
          disabled: false,
          options: response.tags.map((tag) => {
            return {
              label: tag.name,
              value: encodeURIComponent(tag.name),
            };
          }),
        };
      },
    }),

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
    const { list_id, folder_id, space_id, workspace_id, ...params } =
      configValue.propsValue;
    const auth = getAccessTokenOrThrow(configValue.auth);

    const query: Record<string, unknown> = {
      assignees: params.assignees,
      tags: params.tags,
      page: params.page,
      reverse: params.reverse,
      include_closed: params.include_closed,
      order_by: params.order_by,
    };

    if (list_id) query['list_ids'] = list_id;
    if (folder_id) query['project_ids'] = folder_id;
    if (space_id) query['space_ids'] = space_id;

    return (
      await callClickUpApi<ClickupTask>(
        HttpMethod.GET,
        `team/${workspace_id}/task?${decodeURIComponent(qs.stringify(query))}`,
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
