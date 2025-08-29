import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const newDeploySucceeded = createTrigger({
  name: 'new_deploy_succeeded',
  displayName: 'New Deploy Succeeded',
  description: 'Fires when a new site version has successfully deployed',
  type: TriggerStrategy.WEBHOOK,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier of the Netlify site',
      required: true
    })
  },
  sampleData: {
    id: "5f7b8c9d0e1f2a3b4c5d6e7f",
    site_id: "0d3a9d2f-ef94-4380-93df-27ee400e2048",
    build_id: "5f7b8c9d0e1f2a3b4c5d6e7f",
    state: "ready",
    name: "main",
    url: "https://example.netlify.app",
    ssl_url: "https://example.netlify.app",
    admin_url: "https://app.netlify.com/sites/example/deploys/5f7b8c9d0e1f2a3b4c5d6e7f",
    deploy_url: "https://5f7b8c9d0e1f2a3b4c5d6e7f--example.netlify.app",
    deploy_ssl_url: "https://5f7b8c9d0e1f2a3b4c5d6e7f--example.netlify.app",
    branch: "main",
    commit_ref: "abc123def456",
    commit_url: "https://github.com/user/repo/commit/abc123def456",
    created_at: "2023-10-20T14:30:00Z",
    updated_at: "2023-10-20T14:35:00Z",
    published_at: "2023-10-20T14:35:00Z",
    title: "Deploy succeeded",
    context: "production",
    framework: "react",
    screenshot_url: "https://example.netlify.app/.netlify/screenshot.png"
  },
  async onEnable(context) {
    const webhookResponse = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.netlify.com/api/v1/hooks',
      headers: {
        'Authorization': `Bearer ${(context.auth as any).access_token}`,
        'Content-Type': 'application/json'
      },
      body: {
        site_id: context.propsValue.site_id,
        type: 'url',
        event: 'deploy_building',
        data: {
          url: context.webhookUrl
        }
      }
    });

    await context.store.put('hookId', webhookResponse.body.id);
  },
  async onDisable(context) {
    const hookId = await context.store.get('hookId');
    if (hookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.netlify.com/api/v1/hooks/${hookId}`,
        headers: {
          'Authorization': `Bearer ${(context.auth as any).access_token}`
        }
      });
    }
  },
  async run(context) {
    // Only trigger on successful deploys
    const payload = context.payload.body as any;
    if (payload && payload.state === 'ready') {
      return [payload];
    }
    return [];
  }
});