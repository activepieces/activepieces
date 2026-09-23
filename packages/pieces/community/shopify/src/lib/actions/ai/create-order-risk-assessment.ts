import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiCreateOrderRiskAssessment = createAction({
  auth: shopifyAuth,
  name: 'create_order_risk_assessment',
  classification: 'WRITE',
  displayName: 'Create Order Risk Assessment',
  description: 'Record a fraud risk assessment with supporting facts on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds a fraud-risk assessment from this app to one order: a risk level (high, medium, low, none, pending) and at least one fact explaining it. It is shown to staff in the order\'s risk panel and feeds the order\'s risk recommendation; it does not cancel or hold the order. Each call adds another assessment, so do not repeat it.',
    idempotent: false,
  },
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The order id, numeric or "gid://shopify/Order/…". Find it with search_orders.',
      required: true,
    }),
    risk_level: Property.StaticDropdown({
      displayName: 'Risk Level',
      description: 'The assessed fraud risk.',
      required: true,
      options: {
        options: [
          { label: 'High', value: 'HIGH' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'Low', value: 'LOW' },
          { label: 'None', value: 'NONE' },
          { label: 'Pending', value: 'PENDING' },
        ],
      },
    }),
    facts: Property.Array({
      displayName: 'Facts',
      description: 'Reasons behind the assessment, at least one.',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'A short reason, for example "Billing and shipping countries differ".',
          required: true,
        }),
        sentiment: Property.StaticDropdown({
          displayName: 'Sentiment',
          description: 'Whether this fact raises or lowers the risk.',
          required: true,
          options: {
            options: [
              { label: 'Negative (raises risk)', value: 'NEGATIVE' },
              { label: 'Neutral', value: 'NEUTRAL' },
              { label: 'Positive (lowers risk)', value: 'POSITIVE' },
            ],
          },
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const facts = shopifyValues.readRecords(propsValue.facts).map((fact) => {
      const description = shopifyValues.readText(fact['description']);
      const sentiment = shopifyValues.readText(fact['sentiment']);
      if (!description || !sentiment) {
        throw new Error('Every fact needs a description and a sentiment.');
      }
      return { description, sentiment };
    });
    if (facts.length === 0) {
      throw new Error('Provide at least one fact.');
    }
    const orderId = shopifyGraphqlClient.toGid({ type: 'Order', id: propsValue.order_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      orderRiskAssessmentCreate: {
        orderRiskAssessment: {
          riskLevel?: string | null;
          provider?: { title?: string | null } | null;
          facts?: { description?: string | null; sentiment?: string | null }[] | null;
        } | null;
      } | null;
    }>({
      auth,
      query: `mutation CreateOrderRiskAssessment($input: OrderRiskAssessmentCreateInput!) { orderRiskAssessmentCreate(orderRiskAssessmentInput: $input) { orderRiskAssessment { riskLevel provider { title } facts { description sentiment } } userErrors { field message code } } }`,
      variables: { input: { orderId, riskLevel: propsValue.risk_level, facts } },
    });
    const assessment = data.orderRiskAssessmentCreate?.orderRiskAssessment;
    return {
      order_id: orderId,
      risk_level: assessment?.riskLevel ?? null,
      provider: assessment?.provider?.title ?? null,
      facts: (assessment?.facts ?? []).map((fact) => ({
        description: fact.description ?? null,
        sentiment: fact.sentiment ?? null,
      })),
      redacted_fields: redactedFields,
    };
  },
});
