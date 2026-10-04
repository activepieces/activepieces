import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { jotformAuth } from '../../auth';
import { jotformCommon } from '../../common';
import { jotformGetUserHistoryOutputSchema } from '../../output-schemas';

export const getUserHistory = createAction({
  auth: jotformAuth,
  name: 'jotform_get_user_history',
  outputSchema: jotformGetUserHistoryOutputSchema,
  classification: 'SEARCH',
  displayName: 'Get User History',
  description: "Get the connected account's activity log.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the connected account's activity log (action, date, IP address), optionally filtered by action type and date range.",
    idempotent: true,
  },
  props: {
    action: Property.ShortText({
      displayName: 'Action',
      description: 'Filter by action type, e.g. "userLogin" or "formCreate".',
      required: false,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Only include history on or after this date (MM/DD/YYYY).',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Only include history on or before this date (MM/DD/YYYY).',
      required: false,
    }),
  },
  async run(context) {
    const { action, startDate, endDate } = context.propsValue;
    return jotformCommon.request({
      method: HttpMethod.GET,
      path: '/user/history',
      apiKey: context.auth.props.apiKey,
      region: context.auth.props.region,
      queryParams: {
        ...(action !== undefined ? { action } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
      },
    });
  },
});
