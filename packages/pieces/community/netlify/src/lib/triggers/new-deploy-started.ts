import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { netlifyAuth } from "../common/auth";

export const newDeployStarted = createTrigger({
  name: "new_deploy_started",
  displayName: "New Deploy Started",
  description: "Fires immediately when a deploy job starts on your Netlify site",
  auth: netlifyAuth,
  props: {
    siteId: Property.ShortText({
      displayName: "Site ID",
      description: "The ID of the site to monitor for deploy events",
      required: true,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: "deploy_id_123",
    site_id: "site_id_456",
    type: "deploy_created",
    created_at: "2023-01-01T00:00:00Z",
    deploy_time: 30,
    name: "Site Name",
    url: "https://example.netlify.app",
    ssl_url: "https://example.netlify.app",
    admin_url: "https://app.netlify.com/sites/example",
    deploy_url: "https://deploy-preview-123--example.netlify.app",
    build_id: "build_id_789",
    state: "building",
    error_message: null,
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
        event: "deploy_created",
        data: {
          url: context.webhookUrl,
        },
      },
    });

    if (response.status === 201) {
      await context.store.put("deploy_started_webhook_id", response.body.id);
    } else {
      throw new Error(`Failed to create webhook: ${response.status} ${response.statusText}`);
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get("deploy_started_webhook_id");
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${webhookId}`,
        headers: {
          "Authorization": `Bearer ${context.auth.access_token}`,
        },
      });
      await context.store.delete("deploy_started_webhook_id");
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
