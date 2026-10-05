import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { listPaymentGatewaysOutputSchema } from '../../output-schemas';

export const wooAiListPaymentGateways = createAction({
  name: 'list_payment_gateways',
  classification: 'SEARCH',
  displayName: 'List Payment Gateways',
  description: 'List the payment methods installed in the store and whether they are enabled.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the payment gateways installed in the store with their ids, titles, whether they are enabled, and what they support (for example refunds). Use it to pick a payment method for create_order, or to check whether a gateway supports refunds before create_order_refund with Refund Via Gateway. Gateway settings and credentials are never returned.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listPaymentGatewaysOutputSchema,
  props: {},
  async run(context) {
    const gateways = await wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/payment_gateways',
    });
    return gateways.map((gateway) => toPublicGateway(gateway));
  },
});

function toPublicGateway(gateway: unknown): Record<string, unknown> {
  const record: Record<string, unknown> = Object(gateway);
  return {
    id: record['id'],
    title: record['title'],
    description: record['description'],
    order: record['order'],
    enabled: record['enabled'],
    method_title: record['method_title'],
    method_description: record['method_description'],
    method_supports: record['method_supports'],
  };
}
