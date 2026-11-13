import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { netlifyAuth } from '../common/auth';
import { netlifySchemas } from '../common/output-schemas';
import { netlifyProps } from '../common/props';
import { netlifyWebhook } from '../common/webhook';

export const newDeploySucceeded = createTrigger({
  auth: netlifyAuth,
  name: 'new_deploy_succeeded',
  classification: 'READ',
  displayName: 'New Deploy Succeeded',
  description: 'Fires when a new site version has successfully deployed.',
  aiMetadata: {
    description: 'Fires when a deploy on the selected Netlify site finishes successfully (the Deploy succeeded notification, event deploy_created). Use it to run follow-up steps after a site is published, e.g. cache purges, notifications or downstream syncs.',
  },
  props: {
    siteId: netlifyProps.siteDropdown({ description: 'Select the site to watch for deploys.' }),
  },
  outputSchema: netlifySchemas.deploy,
  sampleData: {
    id: "507f1f77bcf86cd799439014",
    site_id: "b6fda79c-0cb0-44ca-8e73-3f5f2c0f0e2d",
    build_id: "5d7725b654c02c0007350e8c",
    state: "ready",
    name: "my-site",
    url: "https://my-site.netlify.app",
    ssl_url: "https://my-site.netlify.app",
    admin_url: "https://app.netlify.com/sites/my-site",
    deploy_url: "https://5d7725b654c02c0007350e8c--my-site.netlify.app",
    deploy_ssl_url: "https://5d7725b654c02c0007350e8c--my-site.netlify.app",
    created_at: "2025-09-02T10:15:30.000Z",
    updated_at: "2025-09-02T10:18:45.000Z",
    published_at: "2025-09-02T10:18:45.000Z",
    user_id: "507f1f77bcf86cd799439012",
    branch: "main",
    commit_ref: "ghi789jkl012",
    commit_url: "https://github.com/user/repo/commit/ghi789jkl012",
    skipped: false,
    locked: false,
    review_id: null,
    framework: "react",
    function_schedules: []
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await netlifyWebhook.enable({ auth: context.auth, siteId: context.propsValue.siteId, event: 'deploy_created', webhookUrl: context.webhookUrl, store: context.store });
  },
  async onDisable(context) {
    await netlifyWebhook.disable({ auth: context.auth, store: context.store });
  },
  async run(context) {
    return netlifyWebhook.receive({ payload: context.payload, store: context.store });
  },
});
