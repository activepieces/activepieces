import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listFiles = createAction({
  name: "list_files",
  displayName: "List Files",
  description: "Returns a list of all the files in the current deploy",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to list files for",
      required: true,
    }),
    deployId: Property.ShortText({
      displayName: "Deploy ID",
      description: "The ID of the deploy to list files for (optional, defaults to current)",
      required: false,
    }),
  },
  async run(context) {
    const { siteId, deployId } = context.propsValue;

    const url = deployId 
      ? `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}/files`
      : `https://api.netlify.com/api/v1/sites/${siteId}/files`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
  },
});
