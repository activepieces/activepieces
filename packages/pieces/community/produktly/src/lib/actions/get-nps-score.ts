import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const getNpsScore = createAction({
  auth: produktlyAuth,
  name: 'get_nps_score',
  displayName: 'Get NPS Score',
  description: 'Get the current Net Promoter Score (NPS) for a widget, broken down into promoters, passives and detractors.',
  props: {
    widget: produktlyProps.npsWidget,
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Optional ISO 8601 date to limit the score to responses from this date onward (e.g. 2024-01-01).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Optional ISO 8601 date to limit the score to responses up to this date (e.g. 2024-12-31).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.start_date) queryParams['startDate'] = propsValue.start_date;
    if (propsValue.end_date) queryParams['endDate'] = propsValue.end_date;
    const response = await produktlyApiCall<{
      npsScore: number;
      totalResponses: number;
      promoters: { count: number; percentage: number };
      passives: { count: number; percentage: number };
      detractors: { count: number; percentage: number };
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/nps-widgets/${propsValue.widget}/score`,
      queryParams,
    });
    return {
      widget_id: propsValue.widget,
      nps_score: response.body.npsScore,
      total_responses: response.body.totalResponses,
      promoters_count: response.body.promoters.count,
      promoters_percentage: response.body.promoters.percentage,
      passives_count: response.body.passives.count,
      passives_percentage: response.body.passives.percentage,
      detractors_count: response.body.detractors.count,
      detractors_percentage: response.body.detractors.percentage,
    };
  },
});
