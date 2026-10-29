import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';
import { netlifyWebhook } from '../common/webhook';

export const newDeployFailed = createTrigger({
  auth: netlifyAuth,
  name: 'new_deploy_failed',
  classification: 'READ',
  displayName: 'New Deploy Failed',
  description: 'Fires when a deploy fails on your Netlify site.',
  aiMetadata: {
    description: 'Fires when a deploy on the selected Netlify site fails to build or publish (the deploy_failed event); the payload includes the error message. Use it to alert on or remediate broken deploys.',
  },
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'Select the site to watch for deploys.' }),
  },
  outputSchema: netlifySchemas.deploy,
  sampleData: {
    id: "507f1f77bcf86cd799439011",
    site_id: "b6fda79c-0cb0-44ca-8e73-3f5f2c0f0e2d",
    build_id: "5d7725b654c02c0007350e8a",
    state: "error",
    name: "my-site",
    url: "https://my-site.netlify.app",
    ssl_url: "https://my-site.netlify.app",
    admin_url: "https://app.netlify.com/sites/my-site",
    deploy_url: "https://5d7725b654c02c0007350e8a--my-site.netlify.app",
    deploy_ssl_url: "https://5d7725b654c02c0007350e8a--my-site.netlify.app",
    created_at: "2025-09-02T10:15:30.000Z",
    updated_at: "2025-09-02T10:16:45.000Z",
    user_id: "507f1f77bcf86cd799439012",
    error_message: "Build failed due to missing dependency",
    branch: "main",
    commit_ref: "abc123def456",
    commit_url: "https://github.com/user/repo/commit/abc123def456",
    skipped: false,
    locked: false
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await netlifyWebhook.enable({ auth: context.auth, siteId: context.propsValue.siteId, event: 'deploy_failed', webhookUrl: context.webhookUrl, store: context.store });
  },
  async onDisable(context) {
    await netlifyWebhook.disable({ auth: context.auth, store: context.store });
  },
  async run(context) {
    return netlifyWebhook.receive({ payload: context.payload, store: context.store });
  },
});
