import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { callClickUpApi, clickupCommon } from "../../common";
import { clickupAuth } from "../../..";
import { ClickupTask } from "../../common/models";
import qs from 'qs';

export const filterClickupWorkspaceTimeEntries = createAction({
  auth: clickupAuth,
  name: 'filter_workspace_time_entries',
  displayName: 'Filter Time Entries',
  description: 'View time entries filtered by start and end date. ',
  props: {
    workspace_id: clickupCommon.workspace_id(true),

    start_date: Property.DateTime({
      displayName: "Start date",
      description: "",
      required: false
    }),
    end_date: Property.DateTime({
      displayName: "End date",
      required: false,
    }),

    space_id: clickupCommon.space_id(false),
    folder_id: clickupCommon.folder_id(false),
    list_id: clickupCommon.list_id(false),
    task_id: clickupCommon.task_id(false, "Task"),

    assignee: clickupCommon.assignee_id(
      false,
      'Assignee Id',
      'ID of assignee for Clickup Task'
    ),

    include_task_tags: Property.Checkbox({
      displayName: "Include task tags",
      description: "Include task tags in the response for time entries associated with tasks.",
      required: false,
      defaultValue: false
    }),
    include_location_names: Property.Checkbox({
      displayName: "Include location names",
      description: "Include the names of the List, Folder, and Space along with the list_id, folder_id, and space_id.",
      required: false,
      defaultValue: false
    })
  },
  async run(configValue) {
    const { task_id, list_id, folder_id, space_id, workspace_id, ...params } = configValue.propsValue;
    const auth = getAccessTokenOrThrow(configValue.auth)

    const query: Record<string, unknown> = {
      assignee: params.assignee?.join(","),
      include_task_tags: params.include_task_tags,
      include_location_names: params.include_location_names
    }

    if (task_id) {
      query['task_id'] = task_id
    } else if (list_id) {
      query['list_id'] = list_id
    } else if (folder_id) {
      query['project_id'] = folder_id
    } else if (space_id) {
      query['space_id'] = space_id
    }

    return (await callClickUpApi<ClickupTask>(
      HttpMethod.GET,
      `team/${workspace_id}/time_entries?${decodeURIComponent(qs.stringify(query))}`,
      auth,
      undefined,
      undefined,
      {
        'Content-Type': 'application/json'
      },
    )).body
  }
})