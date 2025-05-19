import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1';

export const listModels = createAction({
  name: "list_models",
  displayName: "List Models",
  description: "Get a list of all available models",
  props: {},
  async run(context) {
    return await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${COMFYICU_API_URL}/models`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
    });
  },
}); 