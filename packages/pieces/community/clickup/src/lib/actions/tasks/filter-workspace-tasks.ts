import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import qs from 'qs';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon, listTags } from '../../common';
import { ClickupTask } from '../../common/models';
import { filterWorkspaceTasksOutputSchema } from '../../output-schemas';

export const filterClickupWorkspaceTasks = createAction({
  auth: clickupAuth,
  name: 'list_workspace_tasks',
  classification: 'SEARCH',
  displayName: 'List Workspace Tasks',
  description: 'Search tasks across a workspace by location, people and tags.',
  audience: 'human',
  aiMetadata: { description: 'List tasks across an entire ClickUp workspace, filtered by space, folder, list, assignees, and tags, with paging, ordering, and inclusion of closed tasks. Pick this to search or browse tasks broadly when you do not know a specific task ID; use Get Task for a known ID or Get Task by Name to resolve a name within one list. Read-only and idempotent; results are paginated (page starts at 0).', idempotent: true },
  propertyGroups: [
    {
      key: 'scope',
      display: 'section',
      label: 'Search In',
      icon: 'inbox',
      props: ['workspace_id', 'scope_info', 'space_id', 'folder_id', 'list_id'],
    },
    {
      key: 'filters',
      display: 'section',
      label: 'Filters',
      icon: 'filter',
      props: ['assignees', 'tags', 'include_closed'],
    },
    {
      key: 'sort',
      display: 'section',
      label: 'Sort and Page',
      icon: 'sliders',
      props: ['order_by', 'page', 'reverse'],
    },
  ],
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    scope_info: Property.MarkDown({
      value:
        'Leave spaces, folders and lists empty to search the whole workspace.',
      variant: MarkdownVariant.INFO,
    }),
    space_id: {
      ...clickupCommon.space_id(false, true),
      displayName: 'Spaces',
      description: 'Only tasks in these spaces.',
    },
    folder_id: {
      ...clickupCommon.folder_id(false, true),
      displayName: 'Folders',
      description: 'Only tasks in these folders.',
    },
    list_id: {
      ...clickupCommon.list_id(false, true),
      displayName: 'Lists',
      description: 'Only tasks in these lists.',
    },
    assignees: clickupCommon.assignee_id(
      false,
      'Assignees',
      'Only tasks assigned to these people.'
    ),
    tags: Property.MultiSelectDropdown({
      auth: clickupAuth,
      displayName: 'Tags',
      description: 'Only tasks with these tags. Pick a space first.',
      refreshers: ['space_id', 'workspace_id'],
      required: false,
      options: async ({ auth, workspace_id, space_id }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const spaceIds = toSpaceIds(space_id);
        if (!workspace_id || spaceIds.length === 0) {
          return {
            disabled: true,
            placeholder: 'Select a space first',
            options: [],
          };
        }
        const accessToken = getAccessTokenOrThrow(auth);
        const responses = await Promise.all(
          spaceIds.map((spaceId) => listTags(accessToken, spaceId))
        );
        const tagNames = [
          ...new Set(
            responses.flatMap((response) =>
              response.tags.map((tag) => tag.name)
            )
          ),
        ];
        return {
          disabled: false,
          options: tagNames.map((tagName) => ({
            label: tagName,
            value: encodeURIComponent(tagName),
          })),
        };
      },
    }),
    include_closed: Property.Checkbox({
      displayName: 'Include Closed Tasks',
      description: 'Closed tasks are left out unless this is on.',
      required: false,
      defaultValue: false,
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Empty: sorted by date created.',
      required: false,
      width: 'half',
      options: {
        options: [
          { value: 'id', label: 'Task ID' },
          { value: 'created', label: 'Date Created' },
          { value: 'updated', label: 'Last Updated' },
          { value: 'due_date', label: 'Due Date' },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Each page holds up to 100 tasks; the first page is 0.',
      required: false,
      width: 'half',
      defaultValue: 0,
    }),
    reverse: Property.Checkbox({
      displayName: 'Reverse Order',
      description: 'Flip the sort direction.',
      required: false,
      defaultValue: false,
    }),
  },
  outputSchema: filterWorkspaceTasksOutputSchema,
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

function toSpaceIds(spaceId: unknown): string[] {
  const candidates: unknown[] = Array.isArray(spaceId) ? spaceId : [spaceId];
  return candidates.filter(
    (candidate): candidate is string =>
      typeof candidate === 'string' && candidate !== ''
  );
}
