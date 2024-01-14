import { createAction } from "@activepieces/pieces-framework";
import { getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { clickupCommon, listTasks } from "../../common";
import { clickupAuth } from "../../../";

export const getClickupTasks = createAction({
  auth: clickupAuth,
  name: 'get_list_tasks',
  description: 'Gets a list of task from a list',
  displayName: 'Get Tasks',
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    space_id: clickupCommon.space_id(true),
    list_id: clickupCommon.list_id(true),
  },
  async run(configValue) {
    const { list_id } = configValue.propsValue;
    const response = await listTasks(getAccessTokenOrThrow(configValue.auth), list_id as unknown as string)

    return response.tasks;
  },
});
