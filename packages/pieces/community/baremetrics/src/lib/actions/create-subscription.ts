import { 
  createAction, 
  Property,
} from '@activepieces/pieces-framework';
import { baremetricsApiCall, BaremetricsAuth } from '../common/client';
import { baremetricsAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createSubscription = createAction({
  name: 'create_subscription',
  displayName: 'Create Subscription',
  description: 'Creates a new subscription for a customer on a plan',
  auth: baremetricsAuth,
  props: {
    source_id: Property.Dropdown({
      auth: baremetricsAuth,
      displayName: 'Source',
      description: 'Select the data source (Payment Provider or API)',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }

        try {
          const response = await baremetricsApiCall<{ sources: Array<{ id: string; provider: string; provider_id: string }> }>({
            method: HttpMethod.GET,
            path: '/sources',
            auth: auth as BaremetricsAuth,
          });
          
          return {
            disabled: false,
            options: response.sources.map(source => ({
              label: `${source.provider} (${source.id})`,
              value: source.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load sources',
          };
        }
      },
    }),
    oid: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'Your unique ID for this subscription',
      required: true,
    }),
    started_at: Property.DateTime({
      displayName: 'Start Date',
      description: 'When this subscription started',
      required: true,
    }),
    canceled_at: Property.DateTime({
      displayName: 'Cancellation Date',
      description: 'When this subscription was or should be canceled (optional)',
      required: false,
    }),
    customer_oid: Property.Dropdown({
      displayName: 'Customer',
      auth: baremetricsAuth,
      description: 'Select the customer for this subscription',
      required: true,
      refreshers: ['source_id'],
      options: async (propsValue) => {
        const auth = propsValue['auth'];
        const sourceId = propsValue['source_id'] as string | undefined;
        
        if (!auth || !sourceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a source first',
          };
        }

        try {
          const response = await baremetricsApiCall<{ customers: Array<{ oid: string; name?: string; email?: string }> }>({
            method: HttpMethod.GET,
            path: `/${sourceId}/customers`,
            auth: auth as BaremetricsAuth,
          });
          
          return {
            disabled: false,
            options: response.customers.map(customer => ({
              label: customer.name || customer.email || customer.oid,
              value: customer.oid,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load customers',
          };
        }
      },
    }),
    plan_oid: Property.Dropdown({
      displayName: 'Plan',
      auth: baremetricsAuth,
      description: 'Select the plan for this subscription',
      required: true,
      refreshers: ['source_id'],
      options: async (propsValue) => {
        const auth = propsValue['auth'];
        const sourceId = propsValue['source_id'] as string | undefined;
        
        if (!auth || !sourceId) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please select a source first',
          };
        }

        try {
          const response = await baremetricsApiCall<{ plans: Array<{ oid: string; name: string; amount: number; currency: string }> }>({
            method: HttpMethod.GET,
            path: `/${sourceId}/plans`,
            auth: auth as BaremetricsAuth,
          });
          
          return {
            disabled: false,
            options: response.plans.map(plan => ({
              label: `${plan.name} (${plan.currency} ${plan.amount / 100})`,
              value: plan.oid,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load plans',
          };
        }
      },
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Number of subscriptions',
      required: false,
      defaultValue: 1,
    }),
    discount: Property.Number({
      displayName: 'Discount',
      description: 'Discount amount (in the same currency as the plan)',
      required: false,
    }),
    addons: Property.Array({
      displayName: 'Addons',
      description: 'Additional charges to add to the base plan',
      required: false,
      properties: {
        oid: Property.ShortText({
          displayName: 'Addon ID',
          description: 'Your unique ID for this addon',
          required: true,
        }),
        amount: Property.Number({
          displayName: 'Amount',
          description: 'Addon amount (in cents)',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Addon quantity',
          required: true,
          defaultValue: 1,
        }),
      },
    }),
  },
  async run(context) {
    const { source_id, oid, started_at, canceled_at, customer_oid, plan_oid, quantity, discount, addons } = context.propsValue;

    const body: Record<string, any> = {
      oid,
      started_at,
      customer_oid,
      plan_oid,
    };
    
    if (canceled_at) body['canceled_at'] = canceled_at;
    if (quantity !== undefined && quantity !== 1) body['quantity'] = quantity;
    if (discount !== undefined) body['discount'] = discount;
    if (addons && addons.length > 0) body['addons'] = addons;

    const response = await baremetricsApiCall({
      method: HttpMethod.POST,
      path: `/${source_id}/subscriptions`,
      auth: context.auth as BaremetricsAuth,
      body,
    });

    return response;
  },
});
