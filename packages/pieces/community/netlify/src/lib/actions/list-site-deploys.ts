import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const listSiteDeploys = createAction({
  name: "list_site_deploys",
  displayName: "List Site Deploys",
  description: "Returns a list of all deploys for a specific site.",
  props: {
    siteId: Property.Dropdown({
      displayName: "Site",
      description: "Select the site to list deploys for",
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: "Connect your account first",
            options: [],
          };
        }

        const authentication = auth as OAuth2PropertyValue;
        if (!authentication.access_token) {
          return {
            disabled: true,
            placeholder: "Access token is required",
            options: [],
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: "https://api.netlify.com/api/v1/sites?per_page=50",
            headers: {
              "Authorization": `Bearer ${authentication.access_token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.status === 200) {
            const sites = response.body as any[];
            return {
              disabled: false,
              options: sites.map((site) => ({
                label: `${site.name} (${site.url})`,
                value: site.id,
              })),
            };
          } else {
            return {
              disabled: true,
              placeholder: `Failed to fetch sites: ${response.status}`,
              options: [],
            };
          }
        } catch (error) {
          return {
            disabled: true,
            placeholder: "Failed to fetch sites",
            options: [],
          };
        }
      },
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

    if (!context.auth) {
      throw new Error("Authentication is required");
    }

    const auth = context.auth as OAuth2PropertyValue;
    if (!auth.access_token) {
      throw new Error("Access token is required");
    }

    const queryParams = new URLSearchParams();
    if (page) queryParams.append('page', page.toString());
    if (perPage) queryParams.append('per_page', perPage.toString());

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys?${queryParams.toString()}`,
      headers: {
        "Authorization": `Bearer ${auth.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    if (response.status === 404) {
      throw new Error(`Site not found: ${siteId}. Please check the site ID or domain.`);
    }

    if (response.status === 401) {
      throw new Error("Unauthorized. Please check your access token.");
    }

    if (response.status === 403) {
      throw new Error("Forbidden. You don't have permission to access this site.");
    }

    throw new Error(`Failed to list site deploys: ${response.status}`);
  },
});
