import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiGetOrderRiskAssessments = createAction({
  auth: shopifyAuth,
  name: 'get_order_risk_assessments',
  classification: 'READ',
  displayName: 'Get Order Risk Assessments',
  description: 'Get the fraud risk recommendation and assessments of an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the fraud-risk summary of one order: the overall recommendation (accept, investigate, cancel) and every risk assessment with its level, provider and supporting facts. Use it before fulfilling or cancelling a suspicious order. Read-only.',
    idempotent: true,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      order: {
        id: string;
        risk?: {
          recommendation?: string | null;
          assessments?: GqlRiskAssessment[] | null;
        } | null;
      } | null;
    }>({
      auth,
      primaryPaths: ['order.risk'],
      query: `query GetOrderRiskAssessments($id: ID!) { order(id: $id) { id risk { recommendation assessments { riskLevel provider { title } facts { description sentiment } } } } }`,
      variables: { id },
    });
    if (!data.order) {
      throw new Error(`Order ${id} was not found.`);
    }
    const items = (data.order.risk?.assessments ?? []).map((assessment) => ({
      risk_level: assessment.riskLevel ?? null,
      provider: assessment.provider?.title ?? null,
      facts: (assessment.facts ?? []).map((fact) => ({
        description: fact.description ?? null,
        sentiment: fact.sentiment ?? null,
      })),
    }));
    return {
      order_id: data.order.id,
      recommendation: data.order.risk?.recommendation ?? null,
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});

type GqlRiskAssessment = {
  riskLevel?: string | null;
  provider?: { title?: string | null } | null;
  facts?: { description?: string | null; sentiment?: string | null }[] | null;
};
