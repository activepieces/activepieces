import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listSiteDeploys = createAction({
  name: "list_site_deploys",
  displayName: "List Site Deploys",
  description: "Returns a list of all deploys for a specific site",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to list deploys for",
      required: true,
    }),
    page: Property.Number({
      displayName: "Page",
      description: "Page number for pagination (starts from 1)",
      required: false,
      defaultValue: 1,
    }),
    perPage: Property.Number({
      displayName: "Per Page",
      description: "Number of items per page (max 100)",
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { siteId, page, perPage } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (perPage) queryParams.append("per_page", Math.min(perPage, 100).toString());

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys?${queryParams.toString()}`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list site deploys: ${response.status} ${response.statusText}`);
  },
});
