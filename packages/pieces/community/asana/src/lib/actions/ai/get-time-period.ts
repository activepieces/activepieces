import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaTimePeriodOutputSchema } from '../../output-schemas';

export const asanaGetTimePeriodAction = createAction({
  auth: asanaAuth,
  name: 'get_time_period',
  classification: 'READ',
  displayName: 'Get Time Period',
  description: 'Get one Asana goal time period (Advanced Asana plans and up).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one time period: display name, period type, start and end dates and its parent period (for example the fiscal year of a quarter). Goals need an Advanced or higher Asana plan. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaTimePeriodOutputSchema,
  props: {
    time_period: Property.ShortText({
      displayName: 'Time Period GID',
      description: 'Gid of the time period. Obtain it from List Time Periods or from the time_period of a goal.',
      required: true,
    }),
  },
  async run(context) {
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/time_periods/${asanaUtils.pathSegment(context.propsValue.time_period)}`,
      operation: 'Get Time Period',
      query: { opt_fields: ASANA_FIELDS.timePeriod },
    });
  },
});
