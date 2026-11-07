import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetAppCalendarOutputSchema } from '../../../output-schemas';

export const getGlobalCalendarAction = createAction({
  auth: podioAuth,
  name: 'podio_get_global_calendar',
  outputSchema: podioGetAppCalendarOutputSchema,
  displayName: 'Get Global Calendar',
  description: 'Lists the calendar events of the connected user across all workspaces.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every dated item the connected user can access and every task assigned to them, across all workspaces, in a date range. Each event carries a uid, which Update Calendar Event takes. Use Get Space Calendar or Get App Calendar to limit it to one workspace or app.',
    idempotent: true,
  },
  props: {
    dateFrom: podioAiProps.text({ required: false, displayName: 'Date From', description: 'First date to include, as YYYY-MM-DD.' }),
    dateTo: podioAiProps.text({ required: false, displayName: 'Date To', description: 'Last date to include, as YYYY-MM-DD.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
    tasks: podioAiProps.bool({ required: false, displayName: 'Include Tasks', description: '"true" includes tasks, "false" leaves them out. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    const events = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/calendar/`,
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
