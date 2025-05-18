import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const COMFYICU_API_URL = 'https://comfy.icu/api/v1/';

export const createWorkflow = createAction({
  name: "create_workflow",
  displayName: "Create Workflow",
  description: "Create a new workflow",
  props: {
    name: Property.ShortText({
      displayName: "Name",
      description: "The name of the workflow",
      required: true,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "A description of the workflow",
      required: false,
    }),
    nodes: Property.Object({
      displayName: "Nodes",
      description: "The nodes that make up the workflow",
      required: true,
    }),
  },
  async run(context) {
    const { name, description, nodes } = context.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${COMFYICU_API_URL}/workflows/`,
      headers: {
        Authorization: `Bearer ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        name,
        description,
        nodes,
      },
    });
  },
}); 