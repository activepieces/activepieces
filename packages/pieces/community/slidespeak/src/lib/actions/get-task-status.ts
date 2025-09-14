import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "../common/client";

export const getTaskStatus = createAction({
  name: "get_task_status",
  displayName: "Get Task Status",
  description: "Check the status of a SlideSpeak task and retrieve the result if ready.",
  props: {
    task_id: Property.ShortText({
      displayName: "Task ID",
      description: "The Task ID returned by SlideSpeak when generating or editing a presentation.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/task_status/${propsValue.task_id}`
    );
  },
});
