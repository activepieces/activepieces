import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetAppCalendarOutputSchema } from '../../../output-schemas';

export const getSpaceCalendarAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_calendar',
  outputSchema: podioGetAppCalendarOutputSchema,
  displayName: 'Get Space Calendar',
  description: 'Lists the calendar events (dated items and tasks) of a workspace.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the dated items and tasks the connected user can access in one Podio workspace, in a date range; tasks that belong to other workspaces or to no workspace are left out. The space id comes from Get Space or List Org Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace whose calendar to read.' }),
    dateFrom: podioAiProps.text({ required: false, displayName: 'Date From', description: 'First date to include, as YYYY-MM-DD.' }),
    dateTo: podioAiProps.text({ required: false, displayName: 'Date To', description: 'Last date to include, as YYYY-MM-DD.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
    tasks: podioAiProps.bool({ required: false, displayName: 'Include Tasks', description: '"true" includes tasks, "false" leaves them out. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    const events = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/calendar/space/${propsValue.spaceId}/`,
      query: podioUtils.query({
        values: {
          date_from: propsValue.dateFrom,
          date_to: propsValue.dateTo,
          priority: propsValue.priority,
          tasks: podioUtils.toBool({ value: propsValue.tasks }),
        },
      }),
    });
    return { events, count: events.length };
  },
});
