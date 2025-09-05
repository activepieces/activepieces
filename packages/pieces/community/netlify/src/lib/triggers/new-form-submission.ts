import { createTrigger, Property, TriggerStrategy, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";

export const newFormSubmission = createTrigger({
  name: "new_form_submission",
  displayName: "New Form Submission",
  description: "Fires when a Netlify form submission is received.",
  props: {
    siteId: Property.Dropdown({
      displayName: "Site",
      description: "Select the site to monitor for form submissions",
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
  sampleData: {
    id: "507f1f77bcf86cd799439015",
    number: 42,
    email: "user@example.com",
    name: "John Doe",
    first_name: "John",
    last_name: "Doe",
    company: "Acme Corp",
    summary: "Contact form submission from website",
    body: "Hello, I'm interested in your services. Please contact me.",
    data: {
      name: "John Doe",
      email: "user@example.com",
      message: "Hello, I'm interested in your services. Please contact me.",
      phone: "+1-555-123-4567"
    },
    created_at: "2025-09-02T10:15:30.000Z",
    site_url: "https://my-site.netlify.app",
    form_id: "507f1f77bcf86cd799439016",
    form_name: "contact",
    ip: "192.168.1.100",
    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    referrer: "https://my-site.netlify.app/contact"
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
        event: "submission_created",
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
