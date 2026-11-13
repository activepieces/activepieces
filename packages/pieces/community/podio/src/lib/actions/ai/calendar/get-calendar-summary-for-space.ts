import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetCalendarSummaryOutputSchema } from '../../../output-schemas';

export const getCalendarSummaryForSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_get_calendar_summary_for_space',
  outputSchema: podioGetCalendarSummaryOutputSchema,
  displayName: 'Get Calendar Summary for Space',
  description: 'Gets the events of today and the next six days in one workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a short calendar overview of one Podio workspace for the connected user: the events of today and of the next six days, each group with its total and its first events. Use Get Space Calendar for a full list over a chosen date range. The space id comes from Get Space or List Org Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace.' }),
    limit: podioAiProps.limit({ required: false, description: 'Maximum number of events to return in each group (today, upcoming). Defaults to 5.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/calendar/space/${propsValue.spaceId}/summary`,
      query: podioUtils.query({ values: { limit: propsValue.limit, priority: propsValue.priority } }),
    });
  },
});
