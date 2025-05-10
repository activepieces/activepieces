import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://api.comfyicu.com';

export const cancelRun = createAction({
  name: "cancel_run",
  displayName: "Cancel Run",
  description: "Cancel a running workflow execution",
  props: {
    run_id: Property.ShortText({
      displayName: "Run ID",
      description: "The ID of the workflow run to cancel",
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${COMFYICU_API_URL}/runs/${run_id}/cancel`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
  },
}); 