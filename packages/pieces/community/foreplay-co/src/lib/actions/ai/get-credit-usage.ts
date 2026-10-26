import { createAction } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';

const getCreditUsage = createAction({
  auth: foreplayCoAuth,
  name: 'get_credit_usage',
  classification: 'READ',
  displayName: 'Get Credit Usage',
  description: 'Show total and remaining Foreplay API credits for this billing period.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the Foreplay API credits for the current billing period: total, remaining, used, and the period start and end. Free (costs no credits); call it before large ad pulls, which cost 1 credit per ad.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.usage,
  props: {},
  async run({ auth }) {
    const response = await foreplayClient.request({ auth, path: '/api/usage' });
    return foreplayMappers.usage(foreplayMappers.dataOf(response.body));
  },
});

export { getCreditUsage };
