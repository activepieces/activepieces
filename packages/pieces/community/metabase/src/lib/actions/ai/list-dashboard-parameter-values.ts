import { createAction } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchCardParameterValuesOutputSchema } from '../../output-schemas';

export const listDashboardParameterValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_dashboard_parameter_values',
  outputSchema: metabaseSearchCardParameterValuesOutputSchema,
  displayName: 'List Dashboard Parameter Values',
  description: 'List the allowed values of a dashboard filter.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the values a dashboard filter offers, so you can pass a valid value to Run Dashboard Card Query. Use Search Dashboard Parameter Values when the list is long.',
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
    parameterId: metabaseAiProps.parameterId({ required: true }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.listDashboardParameterValues({
      auth,
      dashboardId: propsValue.dashboardId,
      parameterId: propsValue.parameterId,
    });
  },
});
