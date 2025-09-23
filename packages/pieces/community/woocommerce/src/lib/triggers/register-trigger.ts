import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { wooAuth } from '../../';
import { WebhookInformation, wooCommon } from '../common';
import { isEmpty, WebhookHandshakeStrategy } from '@activepieces/shared';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
export const woocommerceRegisterTrigger = ({
  name,
  topic,
  displayName,
  description,
  sampleData,
  testDataEndpoint,
}: {
  name: string;
  topic: string;
  displayName: string;
  description: string;
  sampleData: unknown;
  testDataEndpoint: string;
}) =>
  createTrigger({
    auth: wooAuth,
    name: `$woocommerce_trigger_${name}`,
    displayName,
    description,
    props: {},
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const res = await wooCommon.createWebhook(
        displayName,
        context.webhookUrl,
        topic,
        context.auth as PiecePropValueSchema<typeof wooAuth>
      );
      await context.store.put<WebhookInformation>(
        `$woocommerce_trigger_${name}`,
        res.body
      );
    },
    async onDisable(context) {
      const webhook = await context.store.get<WebhookInformation>(
        `$woocommerce_trigger_${name}`
      );
      if (webhook != null) {
        await wooCommon.deleteWebhook(
          webhook.id,
          context.auth as PiecePropValueSchema<typeof wooAuth>
        );
      }
    },
    // WooCommerce sends a request verifying the webhook that contains only the webhook_id.
    handshakeConfiguration: {
      strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
      paramName: 'webhook_id',
    },
    async onHandshake(context) {
      return {
        status: 200,
        body: { webhook_id: (context.payload.body as any)['webhook_id'] },
      };
    },
    async test(context) {
      const trimmedBaseUrl = context.auth.baseUrl.replace(/\/$/, '');

      const request: HttpRequest = {
        url: `${trimmedBaseUrl}${testDataEndpoint}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: context.auth.consumerKey,
          password: context.auth.consumerSecret,
        },
        queryParams: {
          per_page: '10',
        },
      };

      const response = await httpClient.sendRequest<Array<{ id: number }>>(
        request
      );

      if (isEmpty(response.body)) return [];

      return response.body;
    },
    async run(context) {
      const payload = context.payload.body as Record<string, any>;
      const trimmedBaseUrl = context.auth.baseUrl.replace(/\/$/, '');

      if (payload['webhook_id']) return [];

      if (topic.includes('deleted')) {
        const response = await httpClient.sendRequest({
          url: `${trimmedBaseUrl}${testDataEndpoint}/${payload['id']}`,
          method: HttpMethod.GET,
          authentication: {
            type: AuthenticationType.BASIC,
            username: context.auth.consumerKey,
            password: context.auth.consumerSecret,
          },
          queryParams: {
            per_page: '10',
          },
        });
        return [response.body];
      }

      return [payload];
    },
  });
