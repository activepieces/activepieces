import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listForms = createAction({
  name: "list_forms",
  displayName: "List Forms",
  description: "Returns a list of all forms for a site, including metadata about each form",
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to list forms for",
      required: true,
    }),
  },
  async run(context) {
    const { siteId } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/forms`,
      headers: {
        "Authorization": `Bearer ${context.auth.access_token}`,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(`Failed to list forms: ${response.status} ${response.statusText}`);
  },
});
