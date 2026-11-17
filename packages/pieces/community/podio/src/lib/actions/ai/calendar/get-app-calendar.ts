import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetAppCalendarOutputSchema } from '../../../output-schemas';

export const getAppCalendarAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_calendar',
  outputSchema: podioGetAppCalendarOutputSchema,
  displayName: 'Get App Calendar',
  description: 'Lists the calendar events (dated items and tasks) of an app.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the calendar entries of one Podio app: its items that have a date field and, unless turned off, tasks related to the app. Use Filter App Calendar to keep only items matching a view or filters. The app id comes from Get App or List Apps in Space.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app whose calendar to read.' }),
    dateFrom: podioAiProps.text({ required: false, displayName: 'Date From', description: 'First date to include, as YYYY-MM-DD.' }),
    dateTo: podioAiProps.text({ required: false, displayName: 'Date To', description: 'Last date to include, as YYYY-MM-DD.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
    tasks: podioAiProps.bool({ required: false, displayName: 'Include Tasks', description: '"true" includes tasks, "false" leaves them out. Defaults to "true".' }),
  },
  async run({ auth, propsValue }) {
    const events = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/calendar/app/${propsValue.appId}/`,
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
