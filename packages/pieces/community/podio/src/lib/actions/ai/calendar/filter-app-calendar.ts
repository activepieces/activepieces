import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioFilterAppCalendarOutputSchema } from '../../../output-schemas';

export const filterAppCalendarAction = createAction({
  auth: podioAuth,
  name: 'podio_filter_app_calendar',
  outputSchema: podioFilterAppCalendarOutputSchema,
  displayName: 'Filter App Calendar',
  description: 'Lists the calendar events of an app, limited to the items that match a view or item filters.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the calendar entries (items with a date field, and optionally tasks) of one Podio app, keeping only the items that match a view or the given item filters. Use Get App Calendar when no item filter is needed. The app id comes from Get App or List Apps in Space; a view id comes from List Views.',
    idempotent: true,
  },
  props: {
    appId: podioAiProps.id({ required: true, displayName: 'App ID', description: 'The id of the app whose calendar to read.' }),
    dateFrom: podioAiProps.text({ required: false, displayName: 'Date From', description: 'First date to include, as YYYY-MM-DD.' }),
    dateTo: podioAiProps.text({ required: false, displayName: 'Date To', description: 'Last date to include, as YYYY-MM-DD.' }),
    priority: podioAiProps.number({ required: false, displayName: 'Minimum Priority', description: 'The minimum priority of the events to include. Defaults to 1.' }),
    tasks: podioAiProps.bool({ required: false, displayName: 'Include Tasks', description: '"true" includes tasks, "false" leaves them out. Defaults to "true".' }),
    viewId: podioAiProps.id({ required: false, displayName: 'View ID', description: 'The id of a view whose filters to apply, "default" for the default view, or "0" for the last used view.' }),
    filters: podioAiProps.json({ required: false, displayName: 'Filters', description: 'Item filters, keyed by field id or filter key, in the same format as Filter Items, e.g. {"created_on": {"from": "2026-01-01"}}.' }),
  },
  async run({ auth, propsValue }) {
    const events = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.POST,
      path: `/calendar/app/${propsValue.appId}/filter`,
      body: podioUtils.body({
        values: {
          date_from: propsValue.dateFrom,
          date_to: propsValue.dateTo,
          priority: propsValue.priority,
          tasks: podioUtils.toBool({ value: propsValue.tasks }),
          view_id: propsValue.viewId,
          filters: propsValue.filters,
        },
      }),
    });
    return { events, count: events.length };
  },
});
