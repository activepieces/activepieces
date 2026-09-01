import {
  PiecePropValueSchema,
  TriggerStrategy,
  createTrigger,
  tryCatch,
  OutputSchema,
} from '@activepieces/pieces-framework';
import { wooAuth } from '../auth';
import { WebhookInformation, wooCommon } from '../common';
import { isEmpty } from '@activepieces/pieces-framework';
import { WebhookHandshakeStrategy } from '@activepieces/pieces-framework';
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
  aiMetadata,
  sampleData,
  outputSchema,
  testDataEndpoint,
}: {
  name: string;
  topic: string;
  displayName: string;
  description: string;
  aiMetadata: { description: string };
  sampleData: unknown;
  outputSchema: OutputSchema;
  testDataEndpoint: string;
}) =>
  createTrigger({
    auth: wooAuth,
    name: `$woocommerce_trigger_${name}`,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    props: {},
    sampleData,
    outputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const res = await wooCommon.createWebhook(
        displayName,
        context.webhookUrl,
        topic,
        context.auth.props
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
          context.auth.props
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
      const trimmedBaseUrl = context.auth.props.baseUrl.replace(/\/$/, '');

      const request: HttpRequest = {
        url: `${trimmedBaseUrl}${testDataEndpoint}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BASIC,
          username: context.auth.props.consumerKey,
          password: context.auth.props.consumerSecret,
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
      const trimmedBaseUrl = context.auth.props.baseUrl.replace(/\/$/, '');

      if (payload['webhook_id']) return [];

      if (topic.includes('deleted')) {
        const { data, error } = await tryCatch(() =>
          httpClient.sendRequest({
            url: `${trimmedBaseUrl}${testDataEndpoint}/${payload['id']}`,
            method: HttpMethod.GET,
            authentication: {
              type: AuthenticationType.BASIC,
              username: context.auth.props.consumerKey,
              password: context.auth.props.consumerSecret,
            },
            queryParams: {
              per_page: '10',
            },
          }),
        );
        if (error !== null) {
          return [payload];
        }
        return [data.body];
      }

      return [payload];
    },
  });
