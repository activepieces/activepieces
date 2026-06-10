import { 
  createAction, 
  Property,
} from '@activepieces/pieces-framework';
import { baremetricsApiCall, BaremetricsAuth } from '../common/client';
import { baremetricsAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const createPlan = createAction({
  name: 'create_plan',
  displayName: 'Create Plan',
  description: 'Creates a new plan for use when creating or updating subscriptions',
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
      displayName: 'Plan ID',
      description: 'Your unique ID for this plan',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Plan Name',
      description: 'Your internal name for this plan. This will be displayed in the Plan Breakout section',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'The ISO code of the currency of this plan (e.g., USD)',
      required: true,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'How much is this plan? (In cents)',
      required: true,
    }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Billing interval',
      required: true,
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
        ],
      },
    }),
    interval_count: Property.Number({
      displayName: 'Interval Count',
      description: 'Number of intervals between billings (e.g., 1 for every month, 3 for every 3 months)',
      required: true,
    }),
    trial_duration: Property.Number({
      displayName: 'Trial Duration',
      description: 'The duration of this trial',
      required: false,
    }),
    trial_duration_unit: Property.StaticDropdown({
      displayName: 'Trial Duration Unit',
      description: 'Unit for trial duration',
      required: false,
      options: {
        options: [
          { label: 'Day', value: 'day' },
          { label: 'Month', value: 'month' },
          { label: 'Year', value: 'year' },
        ],
      },
    }),
  },
  async run(context) {
    const { source_id, oid, name, currency, amount, interval, interval_count, trial_duration, trial_duration_unit } = context.propsValue;

    const body: Record<string, any> = {
      oid,
      name,
      currency,
      amount,
      interval,
      interval_count,
    };
    
    if (trial_duration !== undefined) body['trial_duration'] = trial_duration;
    if (trial_duration_unit) body['trial_duration_unit'] = trial_duration_unit;

    const response = await baremetricsApiCall({
      method: HttpMethod.POST,
      path: `/${source_id}/plans`,
      auth: context.auth as BaremetricsAuth,
      body,
    });

    return response;
  },
});
