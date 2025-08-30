import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const getSite = createAction({
  name: "get_site",
  displayName: "Get Site",
  description: "Get a specified site",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to retrieve",
      required: true,
    }),
  },
  async run(context) {
    const { siteId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${siteId}`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to get site: ${response.status} ${response.statusText}`);
  },
});
