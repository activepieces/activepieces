import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listSites = createAction({
  name: "list_sites",
  displayName: "List Sites",
  description: "Returns all sites you have access to",
  props: {
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
    const { page, perPage } = context.propsValue;

    const queryParams = new URLSearchParams();
    if (page) queryParams.append("page", page.toString());
    if (perPage) queryParams.append("per_page", Math.min(perPage, 100).toString());

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites?${queryParams.toString()}`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list sites: ${response.status} ${response.statusText}`);
  },
});
