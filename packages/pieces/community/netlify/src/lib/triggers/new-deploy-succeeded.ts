import { createTrigger, Property, TriggerStrategy, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const newDeploySucceeded = createTrigger({
  name: "new_deploy_succeeded",
  displayName: "New Deploy Succeeded",
  description: "Fires when a new site version has successfully deployed.",
  props: {
    siteId: Property.Dropdown({
      displayName: "Site",
      description: "Select the site to monitor for successful deploy events",
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
  },
  type: TriggerStrategy.WEBHOOK,
  onEnable: async (context) => {
    if (!context.auth) {
      throw new Error("Authentication is required");
    }

    const auth = context.auth as OAuth2PropertyValue;
    if (!auth.access_token) {
      throw new Error("Access token is required");
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: "https://api.netlify.com/api/v1/hooks",
      headers: {
        "Authorization": `Bearer ${auth.access_token}`,
        "Content-Type": "application/json",
      },
      body: {
        site_id: context.propsValue.siteId,
        type: "url",
        event: "deploy_succeeded",
        data: {
          url: context.webhookUrl,
        },
      },
    });

    if (response.status === 201) {
      await context.store.put("webhook_id", response.body.id);
    } else {
      throw new Error(`Failed to create webhook: ${response.status}`);
    }
  },
  onDisable: async (context) => {
    const webhookId = await context.store.get("webhook_id");
    if (webhookId) {
      if (!context.auth) {
        throw new Error("Authentication is required");
      }

      const auth = context.auth as OAuth2PropertyValue;
      if (!auth.access_token) {
        throw new Error("Access token is required");
      }

      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${webhookId}`,
        headers: {
          "Authorization": `Bearer ${auth.access_token}`,
        },
      });
    }
  },
  run: async (context) => {
    return [context.payload.body];
  },
});
