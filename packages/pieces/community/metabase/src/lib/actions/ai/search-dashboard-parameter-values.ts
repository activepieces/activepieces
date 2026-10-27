import { createAction, Property } from '@activepieces/pieces-framework';

import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseSearchCardParameterValuesOutputSchema } from '../../output-schemas';

export const searchDashboardParameterValuesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_search_dashboard_parameter_values',
  outputSchema: metabaseSearchCardParameterValuesOutputSchema,
  displayName: 'Search Dashboard Parameter Values',
  description: 'Search the allowed values of a dashboard filter.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Returns a dashboard filter's values that match a search text. Use it instead of List Dashboard Parameter Values when the filter has many values.",
    idempotent: true,
  },
  props: {
    dashboardId: metabaseAiProps.dashboardId({ required: true }),
    parameterId: metabaseAiProps.parameterId({ required: true }),
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'Text to match against the filter values.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.searchDashboardParameterValues({
      auth,
      dashboardId: propsValue.dashboardId,
      parameterId: propsValue.parameterId,
      query: propsValue.query,
    });
  },
});
