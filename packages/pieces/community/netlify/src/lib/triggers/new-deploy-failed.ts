import {
  createTrigger,
  TriggerStrategy,
  WebhookHandshakeStrategy,
  Property
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { netlifyAuth } from '../common/auth';
import { NetlifyClient } from '../common/client';
import { siteIdProperty } from '../common/utils';

export const newDeployFailedTrigger = createTrigger({
  auth: netlifyAuth,
  name: 'new_deploy_failed',
  displayName: 'New Deploy Failed',
  description: 'Triggers when a deployment fails',
  props: {
    siteId: siteIdProperty
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = new NetlifyClient(context.auth);
    
    try {
      // Create webhook for deploy failed events
      const webhookData = {
        url: context.webhookUrl,
        event: 'deploy_failed',
        disabled: false
      };

      const response = await client.createWebhook(context.propsValue.siteId, webhookData);
      
      // Store webhook details for cleanup
      await context.store?.put('webhook_details', {
        webhookId: response.id,
        siteId: context.propsValue.siteId,
        webhookUrl: context.webhookUrl
      });

      console.log('Webhook created for new deploy failed events:', response);
    } catch (error) {
      console.error('Failed to create webhook for new deploy failed events:', error);
      throw error;
    }
  },
  async onDisable(context) {
    const client = new NetlifyClient(context.auth);
    
    try {
      const webhookDetails = await context.store?.get('webhook_details');
      
      if (webhookDetails?.webhookId) {
        await client.deleteWebhook(webhookDetails.webhookId);
        console.log('Webhook deleted for new deploy failed events');
      }
    } catch (error) {
      console.error('Failed to delete webhook for new deploy failed events:', error);
    }
  },
  async run(context) {
    const payload = context.payload.body;
    
    // Validate that this is a failed deploy event
    if (!payload || payload.state !== 'error') {
      return [];
    }

    return [
      {
        id: payload.id,
        siteId: payload.site_id,
        url: payload.deploy_url,
        sslUrl: payload.ssl_url,
        adminUrl: payload.admin_url,
        status: payload.state,
        context: payload.context,
        branch: payload.branch,
        commitRef: payload.commit_ref,
        commitUrl: payload.commit_url,
        title: payload.title,
        errorMessage: payload.error_message,
        createdAt: payload.created_at,
        updatedAt: payload.updated_at,
        reviewId: payload.review_id,
        reviewUrl: payload.review_url,
        framework: payload.framework,
        buildTime: payload.deploy_time,
        site: {
          id: payload.site_id,
          name: payload.name,
          url: payload.url
        },
        rawPayload: payload
      }
    ];
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'challenge'
  },
  sampleData: {
    id: 'deploy_123456789',
    siteId: 'site_123456789',
    url: 'https://deploy-preview-123--mysite.netlify.app',
    sslUrl: 'https://deploy-preview-123--mysite.netlify.app',
    adminUrl: 'https://app.netlify.com/sites/mysite/deploys/deploy_123456789',
    status: 'error',
    context: 'deploy-preview',
    branch: 'feature-branch',
    commitRef: 'abc123def456',
    commitUrl: 'https://github.com/user/repo/commit/abc123def456',
    title: 'Deploy Preview for PR #123',
    errorMessage: 'Build failed: Command failed with exit code 1',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:03:00Z',
    reviewId: 123,
    reviewUrl: 'https://github.com/user/repo/pull/123',
    framework: 'react',
    buildTime: 180,
    site: {
      id: 'site_123456789',
      name: 'My Awesome Site',
      url: 'https://mysite.netlify.app'
    }
  }
});
