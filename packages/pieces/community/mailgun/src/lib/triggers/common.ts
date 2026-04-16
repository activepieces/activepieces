import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import {
  mailgunCommon,
  mailgunApiCall,
  subscribeWebhook,
  unsubscribeWebhook,
  verifyMailgunSignature,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

function flattenEventData(eventData: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(eventData)) {
    const flatKey = key.replace(/-/g, '_');
    if (value === null || value === undefined) {
      result[flatKey] = null;
    } else if (Array.isArray(value)) {
      result[flatKey] = value
        .map((v) => (typeof v === 'object' ? JSON.stringify(v) : String(v)))
        .join(', ');
    } else if (typeof value === 'object') {
      const nested = flattenEventData(value as Record<string, unknown>);
      for (const [nestedKey, nestedValue] of Object.entries(nested)) {
        result[`${flatKey}_${nestedKey}`] = nestedValue;
      }
    } else {
      result[flatKey] = value;
    }
  }
  return result;
}

export function createMailgunWebhookTrigger({
  name,
  displayName,
  description,
  eventType,
  testEventFilter,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  testEventFilter: Record<string, string>;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: mailgunAuth,
    name,
    displayName,
    description,
    props: {
      domain: mailgunCommon.domainDropdown,
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
      const auth = context.auth;
      await subscribeWebhook({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        domain: context.propsValue.domain,
        eventType,
        webhookUrl: context.webhookUrl,
      });
    },

    async onDisable(context) {
      const auth = context.auth;
      await unsubscribeWebhook({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        domain: context.propsValue.domain,
        eventType,
      });
    },

    async run(context) {
      const payload = context.payload.body as {
        signature?: {
          timestamp: string;
          token: string;
          signature: string;
        };
        'event-data'?: Record<string, unknown>;
      };

      if (!payload.signature) {
        return [];
      }
      const isValid = verifyMailgunSignature(
        context.auth.props.api_key,
        payload.signature.timestamp,
        payload.signature.token,
        payload.signature.signature,
      );
      if (!isValid) {
        return [];
      }

      const eventData = payload['event-data'];
      if (!eventData) {
        return [payload];
      }
      return [flattenEventData(eventData)];
    },

    async test(context) {
      const auth = context.auth;
      const response = await mailgunApiCall<{
        items: Record<string, unknown>[];
      }>({
        apiKey: auth.props.api_key,
        region: auth.props.region,
        method: HttpMethod.GET,
        path: `/v3/${context.propsValue.domain}/events`,
        queryParams: {
          ...testEventFilter,
          limit: '5',
        },
      });
      if (!response.body.items || response.body.items.length === 0) {
        return [sampleData];
      }
      return response.body.items.map((item) => flattenEventData(item));
    },
  });
}
