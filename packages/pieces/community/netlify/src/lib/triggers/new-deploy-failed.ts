import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../common/auth";

export const newDeployFailed = createTrigger({
  name: "new_deploy_failed",
  displayName: "New Deploy Failed",
  description: "Fires when a site deploy fails",
  auth: netlifyAuth,
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to monitor for failed deploy events",
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: "deploy_id_123",
    site_id: "site_id_456",
    type: "deploy_failed",
    created_at: "2023-01-01T00:00:00Z",
    deploy_time: 0,
    name: "Site Name",
    url: "https://example.netlify.app",
    ssl_url: "https://example.netlify.app",
    admin_url: "https://app.netlify.com/sites/example",
    deploy_url: "https://deploy-preview-123--example.netlify.app",
    build_id: "build_id_789",
    state: "error",
    error_message: "Build failed due to compilation errors",
    branch: "main",
    commit_ref: "commit_hash",
    commit_url: "https://github.com/user/repo/commit/commit_hash",
    skip: false,
    updated_at: "2023-01-01T00:00:00Z",
    published_at: null,
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
        event: "deploy_failed",
        data: {
          url: context.webhookUrl,
        },
      },
    });

    if (response.status === 201) {
      await context.store.put("deploy_failed_webhook_id", response.body.id);
    } else {
      throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get("deploy_failed_webhook_id");
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${webhookId}`,
        headers: {
          "Authorization": `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete("deploy_failed_webhook_id");
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
