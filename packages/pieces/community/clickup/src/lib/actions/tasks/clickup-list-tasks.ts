import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import qs from 'qs';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon, listTags } from '../../common';
import { ClickupTask } from '../../common/models';

export const clickupListTasksAi = createAction({
  auth: clickupAuth,
  name: 'clickup_list_tasks',
  displayName: 'List Tasks',
  description:
    'Retrieves the tasks that meet specific criteria from a Workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List tasks across an entire ClickUp workspace, filtered by space, folder, list, assignees, and tags, with paging and ordering. Pick this to search or browse tasks broadly across the workspace when you do not know a task ID; to list only the tasks of one specific list use List List Tasks, and for a known ID use Get Task. Read-only and idempotent; results are paginated (page starts at 0).',
    idempotent: true,
  },
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
      auth: clickupAuth,
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

    // These ClickUp filters MUST be arrays (the API rejects a scalar with
    // "<x>_ids must be an array"). The props are multi-selects, but an agent
    // may send a single id as a scalar string — coerce to an array so that
    // shape works instead of 400-ing.
    const toArray = (v: unknown): unknown[] | undefined => {
      if (v === undefined || v === null || v === '') return undefined;
      return Array.isArray(v) ? v : [v];
    };

    const query: Record<string, unknown> = {
      assignees: toArray(params.assignees),
      tags: toArray(params.tags),
      page: params.page,
      reverse: params.reverse,
      include_closed: params.include_closed,
      order_by: params.order_by,
    };

    const listIds = toArray(list_id);
    const folderIds = toArray(folder_id);
    const spaceIds = toArray(space_id);
    if (listIds) query['list_ids'] = listIds;
    if (folderIds) query['project_ids'] = folderIds;
    if (spaceIds) query['space_ids'] = spaceIds;

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
