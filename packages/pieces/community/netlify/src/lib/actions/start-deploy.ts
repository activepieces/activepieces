import { createAction, Property, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const startDeploy = createAction({
  name: "start_deploy",
  displayName: "Start Deploy",
  description: "Triggers a new build for a site on Netlify. Supports clearing build cache.",
  props: {
    siteId: Property.Dropdown({
      displayName: "Site",
      description: "Select the site to deploy",
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
    clearCache: Property.Checkbox({
      displayName: "Clear Build Cache",
      description: "Whether to clear the build cache before building",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { siteId, clearCache } = context.propsValue;

    if (!context.auth) {
      throw new Error("Authentication is required");
    }

    const auth = context.auth as OAuth2PropertyValue;
    if (!auth.access_token) {
      throw new Error("Access token is required");
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.netlify.com/api/v1/sites/${siteId}/deploys`,
      headers: {
        "Authorization": `Bearer ${auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: {
        clear_cache: clearCache,
      },
    });

    if (response.status === 200 || response.status === 201) {
      return response.body;
    }

    if (response.status === 404) {
      throw new Error(`Site not found: ${siteId}. Please check the site ID or domain.`);
    }

    if (response.status === 401) {
      throw new Error("Unauthorized. Please check your access token.");
    }

    if (response.status === 403) {
      throw new Error("Forbidden. You don't have permission to deploy this site.");
    }

    throw new Error(`Failed to start deploy: ${response.status}`);
  },
});
