import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const restoreDeploy = createAction({
  name: "restore_deploy",
  displayName: "Restore Deploy (Rollback)",
  description: "Restores an old deploy and makes it the live version of the site",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site",
      required: true,
    }),
    deployId: Property.ShortText({
      displayName: "Deploy ID",
      description: "The ID of the deploy to restore",
      required: true,
    }),
  },
  async run(context) {
    const { siteId, deployId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys/${deployId}/restore`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200 || response.status === 201) {
      return response.body;
    }

    throw new Error(`Failed to restore deploy: ${response.status} ${response.statusText}`);
  },
});
