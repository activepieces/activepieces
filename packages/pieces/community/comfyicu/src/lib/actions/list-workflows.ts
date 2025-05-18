import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const listWorkflows = createAction({
  name: "list_workflows",
  displayName: "List Workflows",
  description: "Get a list of all available workflows",
  props: {},
  async run(context) {
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COMFYICU_API_URL}/workflows`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
  },
});