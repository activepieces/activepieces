import { createAction, Property } from '@activepieces/pieces-framework';
import { pinchPaymentsAuth } from '../common/auth';
import { listPayers, listPlans, createSubscription } from '../common/client';

export const addSubscriptionAction = createAction({
  auth: pinchPaymentsAuth,
  name: 'add_subscription',
  displayName: 'Add Subscription',
  description: 'Create a subscription between a payer and a plan',
  props: {
    planId: Property.Dropdown({
      displayName: 'Plan',
      description: 'Select the plan for this subscription',
      required: true,
      auth: pinchPaymentsAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        const credentials = auth.props as { username: string; password: string };
        const response = await listPlans(credentials, { pageSize: 500 });

        return {
          disabled: false,
          options: response.data.map((plan: { id: string; name: string }) => ({
            label: `${plan.name} (${plan.id})`,
            value: plan.id,
          })),
        };
      },
    }),
    payerId: Property.Dropdown({
      displayName: 'Payer',
      description: 'Select the payer for this subscription',
      required: true,
      auth: pinchPaymentsAuth,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }

        const credentials = auth.props as { username: string; password: string };
        const response = await listPayers(credentials, { pageSize: 500 });

        return {
          disabled: false,
          options: response.data.map((payer: { id: string; firstName: string; lastName: string; emailAddress: string }) => ({
            label: `${payer.firstName} ${payer.lastName || ''} (${payer.emailAddress})`.trim(),
            value: payer.id,
          })),
        };
      },
    }),
    totalAmount: Property.Number({
      displayName: 'Total Amount (cents)',
      description: 'Required for percentage-based plans: total amount in cents (e.g., $100.00 = 10000)',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      description: 'When the subscription should start. Leave blank for immediate start',
      required: false,
    }),
    sourceId: Property.ShortText({
      displayName: 'Source ID',
      description: 'Optional: Specific payment source ID to use. If omitted, a source will be automatically selected',
      required: false,
    }),
    surcharge: Property.StaticMultiSelectDropdown({
      displayName: 'Surcharge Source Types',
      description: 'Select source types to surcharge (pass fees to customer)',
      required: false,
      options: {
        options: [
          { label: 'Bank Account', value: 'bank-account' },
          { label: 'Credit Card', value: 'credit-card' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      planId,
      payerId,
      totalAmount,
      startDate,
      sourceId,
      surcharge,
    } = context.propsValue;

    const subscriptionData: Record<string, unknown> = {
      planId,
      payerId,
    };

    // Add optional fields
    if (totalAmount) subscriptionData['totalAmount'] = totalAmount;
    if (startDate) subscriptionData['startDate'] = startDate.toString().split('T')[0]; // Format as YYYY-MM-DD
    if (sourceId) subscriptionData['sourceId'] = sourceId;
    if (surcharge && surcharge.length > 0) subscriptionData['surcharge'] = surcharge;

    return await createSubscription(
      {
        username: context.auth.props.username,
        password: context.auth.props.password,
      },
      subscriptionData as any
    );
  },
});
