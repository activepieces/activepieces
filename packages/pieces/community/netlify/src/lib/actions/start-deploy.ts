import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const startDeploy = createAction({
  name: "start_deploy",
  displayName: "Start Deploy",
  description: "Triggers a new build for a site on Netlify. Supports clearing build cache.",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to deploy",
      required: true,
    }),
    clearCache: Property.Checkbox({
      displayName: "Clear Build Cache",
      description: "Whether to clear the build cache before deploying",
      required: false,
      defaultValue: false,
    }),
    draft: Property.Checkbox({
      displayName: "Draft Deploy",
      description: "Whether this is a draft deploy",
      required: false,
      defaultValue: false,
    }),
    branch: Property.ShortText({
      displayName: "Branch",
      description: "The branch to deploy from",
      required: false,
    }),
    title: Property.ShortText({
      displayName: "Deploy Title",
      description: "A title for the deploy",
      required: false,
    }),
  },
  async run(context) {
    const { siteId, clearCache, draft, branch, title } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: {
        clear_cache: clearCache,
        draft: draft,
        ...(branch && { branch }),
        ...(title && { title }),
      },
    });

    if (response.status === 200 || response.status === 201) {
      return response.body;
    }

    throw new Error(`Failed to start deploy: ${response.status} ${response.statusText}`);
  },
});
