import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, OutputSchema } from '@activepieces/pieces-framework';
import { genderApiAuth } from '../common/auth';
import { genderApiCommon } from '../common/client';

function statisticsOutputSchema(): OutputSchema {
  return {
    fields: [
      { key: 'remaining_credits', label: 'Remaining Credits', format: 'number' },
      { key: 'is_limit_reached', label: 'Limit Reached', format: 'boolean' },
      {
        key: 'usage_last_month',
        label: 'Usage Last Month',
        children: [
          { key: 'date', label: 'Month', description: 'Year and month of the usage period (YYYY-MM)' },
          { key: 'credits_used', label: 'Credits Used', format: 'number' },
        ],
      },
    ],
  };
}

export const getStatistics = createAction({
  auth: genderApiAuth,
  name: 'getStatistics',
  classification: 'READ',
  displayName: 'Get Statistics',
  description:
    'Get account statistics including remaining credits and usage information',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves the Gender API account statistics, including remaining credits, whether the limit is reached and last month usage. Use to check quota before running batches of name lookups. Takes no input, costs no credits; read-only and safe to repeat.',
    idempotent: true,
  },
  props: {},
  outputSchema: statisticsOutputSchema(),
  async run({ auth }) {
    const response = await genderApiCommon.request<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: '/statistic',
    });
    const data = genderApiCommon.toRecord(response);
    const usage = genderApiCommon.toRecord(data['usage_last_month']);
    return {
      remaining_credits: genderApiCommon.toNumber(data['remaining_credits']),
      is_limit_reached: data['is_limit_reached'] === true,
      usage_last_month: {
        date: genderApiCommon.toText(usage['date']),
        credits_used: genderApiCommon.toNumber(usage['credits_used']),
      },
      ...data,
    };
  },
});
