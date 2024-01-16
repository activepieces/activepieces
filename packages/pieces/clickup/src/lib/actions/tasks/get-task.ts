import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, getAccessTokenOrThrow } from "@activepieces/pieces-common";
import { callClickUpApi } from "../../common";
import { clickupAuth } from "../../../";


export const getClickupTask = createAction({
  auth: clickupAuth,
  name: 'get_list_task',
  description: 'Gets a task in a ClickUp list',
  displayName: 'Get Task',
  props: {
    task_id: Property.ShortText({
      description: 'The id of the tas to get',
      displayName: 'Task ID',
      required: true,
  }),
  },
  async run(configValue) {
    const { task_id } = configValue.propsValue;
    const response = await callClickUpApi(HttpMethod.GET,
      `task/${task_id}`, getAccessTokenOrThrow(configValue.auth), {
    });

    return response.body;
  },
});
