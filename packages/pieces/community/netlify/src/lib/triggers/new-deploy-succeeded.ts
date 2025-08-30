import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../common/auth";

export const newDeploySucceeded = createTrigger({
  name: "new_deploy_succeeded",
  displayName: "New Deploy Succeeded",
  description: "Fires when a new site version has successfully deployed (Note: This may require polling as webhook event may not be available)",
  auth: netlifyAuth,
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to monitor for successful deploy events",
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: "deploy_id_123",
    site_id: "site_id_456",
    type: "deploy_succeeded",
    created_at: "2023-01-01T00:00:00Z",
    deploy_time: 30,
    name: "Site Name",
    url: "https://example.netlify.app",
    ssl_url: "https://example.netlify.app",
    admin_url: "https://app.netlify.com/sites/example",
    deploy_url: "https://deploy-preview-123--example.netlify.app",
    build_id: "build_id_789",
    state: "ready",
    error_message: null,
    branch: "main",
    commit_ref: "commit_hash",
    commit_url: "https://github.com/user/repo/commit/commit_hash",
    skip: false,
    updated_at: "2023-01-01T00:00:00Z",
    published_at: "2023-01-01T00:00:30Z",
    user_id: "user_id_123",
    context: "production",
    locked: false,
    review_id: null,
    title: "Deploy Title",
    review_url: null,
    manual_deploy: false,
    screenshot_url: null,
    site_capabilities: {
      large_media_enabled: false,
    },
    framework: "jekyll",
    function_schedules: [],
    plugins: [],
    has_draft_shift: false,
  },
  async onEnable(context) {
    // Note: deploy_succeeded may not be a valid webhook event
    // This trigger may need to be implemented as a polling trigger instead
    // For now, we'll try to create the webhook but it may fail
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: "https://api.netlify.com/api/v1/hooks",
        headers: {
          "Authorization": `Bearer ${context.auth.access_token}`,
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
        await context.store.put("deploy_succeeded_webhook_id", response.body.id);
      } else {
        throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      // If webhook creation fails, this trigger may not be supported
      // Consider implementing as a polling trigger instead
      throw new Error(`Webhook creation failed. This event may not be supported. Consider using a polling trigger instead. Error: ${error}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get("deploy_succeeded_webhook_id");
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${webhookId}`,
        headers: {
          "Authorization": `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete("deploy_succeeded_webhook_id");
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
