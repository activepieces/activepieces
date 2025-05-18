import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://api.comfyicu.com';

export const getRunStatus = createAction({
  name: "get_run_status",
  displayName: "Get Run Status",
  description: "Get the status of a workflow run",
  props: {
    run_id: Property.ShortText({
      displayName: "Run ID",
      description: "The ID of the workflow run to check",
      required: true,
    }),
  },
  async run(context) {
    const { run_id } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COMFYICU_API_URL}/runs/${run_id}`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
  },
}); 