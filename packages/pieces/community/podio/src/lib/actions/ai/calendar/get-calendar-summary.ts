import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetCalendarSummaryOutputSchema } from '../../../output-schemas';

export const getCalendarSummaryAction = createAction({
  auth: podioAuth,
  name: 'podio_get_calendar_summary',
  outputSchema: podioGetCalendarSummaryOutputSchema,
  displayName: 'Get Calendar Summary',
  description: 'Gets the events of today and the next six days for the connected user.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a short calendar overview for the connected user across all workspaces: the events of today and of the next six days, each group with its total and its first events. Use Get Global Calendar for a full list over a chosen date range.',
    idempotent: true,
  },
  props: {
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of events to return in each group (today, upcoming). Defaults to 5.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/calendar/summary`,
      query: podioUtils.query({ values: { limit: propsValue.limit, priority: propsValue.priority } }),
    });
  },
});
