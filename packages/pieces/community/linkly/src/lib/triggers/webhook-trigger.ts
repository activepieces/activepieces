import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { linklyAuth } from '../auth';
import { linklyApiCall } from '../common/client';
import { workspaceDropdown } from '../common/props';

export function createLinklyWebhookTrigger({
  name,
  displayName,
  description,
  aiDescription,
  event,
  sampleData,
}: LinklyWebhookTriggerParams) {
  return createTrigger({
    auth: linklyAuth,
    name,
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    type: TriggerStrategy.WEBHOOK,
    props: {
      workspace_id: workspaceDropdown,
    },
    sampleData,
    async onEnable(context) {
      await linklyApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.POST,
        path: `/workspace/${context.propsValue.workspace_id}/webhooks`,
        body: { url: context.webhookUrl },
      });
    },
    async onDisable(context) {
      await linklyApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/workspace/${context.propsValue.workspace_id}/webhooks/${encodeURIComponent(context.webhookUrl)}`,
      });
    },
    async run(context) {
      const body = context.payload.body;
      if (readEvent(body) !== event) {
        return [];
      }
      return [body];
    },
  });
}

function readEvent(body: unknown): string | undefined {
  if (typeof body === 'object' && body !== null && 'event' in body) {
    const value = Reflect.get(body, 'event');
    return typeof value === 'string' ? value : undefined;
  }
  return undefined;
}

export const sampleLink = {
  id: 12345,
  name: 'Summer promo',
  url: 'https://example.com/landing-page',
  full_url: 'https://go.yourcompany.com/summer',
  domain: 'go.yourcompany.com',
  slug: '/summer',
  workspace_id: 42,
  enabled: true,
  cloaking: false,
  forward_params: true,
  block_bots: true,
  public_analytics: false,
  utm_source: 'newsletter',
  utm_medium: 'email',
  utm_campaign: 'summer-sale',
  og_title: null,
  og_description: null,
  rules: [],
};

export type LinklyWebhookTriggerParams = {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  event: 'click' | 'link.created' | 'link.updated' | 'link.deleted';
  sampleData: unknown;
};
