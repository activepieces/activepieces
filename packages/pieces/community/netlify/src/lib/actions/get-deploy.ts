import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getDeploy = createAction({
  name: "get_deploy",
  displayName: "Get Deploy",
  description: "Returns a specific deploy",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site",
      required: true,
    }),
    deployId: Property.ShortText({
      displayName: "Deploy ID",
      description: "The ID of the deploy to retrieve",
      required: true,
    }),
  },
  async run(context) {
    const { siteId, deployId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to get deploy: ${response.status} ${response.statusText}`);
  },
});
