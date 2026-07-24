import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';
import { produktlyProps } from '../common/props';

export const listNpsResponses = createAction({
  auth: produktlyAuth,
  name: 'list_nps_responses',
  displayName: 'List NPS Responses',
  description: 'List individual NPS responses (rating + comment + user info) for a widget.',
  props: {
    widget: produktlyProps.npsWidget,
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of responses to return (1-100, default 50).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of responses to skip for pagination (default 0).',
      required: false,
      defaultValue: 0,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Optional ISO 8601 date to filter responses from (e.g. 2024-01-01).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Optional ISO 8601 date to filter responses up to (e.g. 2024-12-31).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {
      limit: String(propsValue.limit ?? 50),
      offset: String(propsValue.offset ?? 0),
    };
    if (propsValue.start_date) queryParams['startDate'] = propsValue.start_date;
    if (propsValue.end_date) queryParams['endDate'] = propsValue.end_date;
    const response = await produktlyApiCall<{
      data: Array<{
        id: number;
        rating: string;
        comment: string;
        email: string;
        name: string;
        userId: string;
        url: string;
        language: string;
        createdAt: string;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/nps-widgets/${propsValue.widget}/responses`,
      queryParams,
    });
    return response.body.data.map((resp) => ({
      response_id: resp.id,
      response_rating: resp.rating,
      response_comment: resp.comment,
      response_email: resp.email,
      response_user_name: resp.name,
      response_user_id: resp.userId,
      response_url: resp.url,
      response_language: resp.language,
      response_created_at: resp.createdAt,
    }));
  },
});
