import { createAction, OutputSchema, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../../auth';
import { posthogClient } from '../../common/client';
import { posthogMappers } from '../../common/mappers';

const MATH_OPTIONS = ['total', 'dau', 'weekly_active', 'monthly_active'];
const INTERVALS = ['hour', 'day', 'week', 'month'];
const DISPLAYS = ['ActionsLineGraph', 'ActionsBar', 'BoldNumber', 'ActionsTable', 'ActionsPie'];

const createdInsightOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Insight ID', format: 'number' },
    { key: 'shortId', label: 'Short ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'query', label: 'Query (raw)' },
    { key: 'dashboardIds', label: 'Dashboard IDs' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

function oneOf({ value, label, allowed, fallback }: { value: unknown; label: string; allowed: string[]; fallback: string }): string {
  const text = posthogClient.optionalText(value) ?? fallback;
  if (!allowed.includes(text)) throw new Error(`${label} must be one of: ${allowed.join(', ')}.`);
  return text;
}

export const createInsight = createAction({
  auth: posthogAuth,
  name: 'create_insight',
  classification: 'WRITE',
  displayName: 'Create Trends Insight',
  description: 'Save a trends chart of one event, optionally on a dashboard.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates and saves a PostHog trends insight that counts one event over time, e.g. event "$pageview" with math dau for daily unique users. math: total (default, event count), dau, weekly_active, monthly_active. dateFrom is a relative range like -7d (default), -30d, -12m or a date YYYY-MM-DD. interval: hour, day (default), week, month. display: ActionsLineGraph (default), ActionsBar, BoldNumber, ActionsTable, ActionsPie. dashboardId (numeric, from List Dashboards or Create Dashboard) also adds it to that dashboard. Each call creates another insight. Returns id, shortId and a link; use Get Insight for the numbers.',
    idempotent: false,
  },
  outputSchema: createdInsightOutputSchema,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    event: Property.ShortText({ displayName: 'Event', required: true, defaultValue: '$pageview' }),
    math: Property.StaticDropdown({
      displayName: 'Aggregation',
      required: false,
      defaultValue: 'total',
      options: {
        options: [
          { label: 'Total count', value: 'total' },
          { label: 'Unique users (daily)', value: 'dau' },
          { label: 'Weekly active users', value: 'weekly_active' },
          { label: 'Monthly active users', value: 'monthly_active' },
        ],
      },
    }),
    dateFrom: Property.ShortText({ displayName: 'Date From', description: 'e.g. -7d, -30d, 2026-01-01', required: false, defaultValue: '-7d' }),
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      required: false,
      defaultValue: 'day',
      options: { options: INTERVALS.map((v) => ({ label: v, value: v })) },
    }),
    display: Property.StaticDropdown({
      displayName: 'Chart Type',
      required: false,
      defaultValue: 'ActionsLineGraph',
      options: {
        options: [
          { label: 'Line', value: 'ActionsLineGraph' },
          { label: 'Bar', value: 'ActionsBar' },
          { label: 'Number', value: 'BoldNumber' },
          { label: 'Table', value: 'ActionsTable' },
          { label: 'Pie', value: 'ActionsPie' },
        ],
      },
    }),
    description: Property.LongText({ displayName: 'Description', required: false }),
    dashboardId: Property.ShortText({ displayName: 'Dashboard ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const name = posthogClient.requiredText({ value: propsValue.name, label: 'Name' });
    const event = posthogClient.requiredText({ value: propsValue.event, label: 'Event' });
    const math = oneOf({ value: propsValue.math, label: 'Aggregation', allowed: MATH_OPTIONS, fallback: 'total' });
    const interval = oneOf({ value: propsValue.interval, label: 'Interval', allowed: INTERVALS, fallback: 'day' });
    const display = oneOf({ value: propsValue.display, label: 'Chart Type', allowed: DISPLAYS, fallback: 'ActionsLineGraph' });
    const dateFrom = posthogClient.optionalText(propsValue.dateFrom) ?? '-7d';
    if (!/^-\d+[hdwmy]$/.test(dateFrom) && !/^\d{4}-\d{2}-\d{2}$/.test(dateFrom)) {
      throw new Error('Date From must be a relative range like -7d, -4w, -12m or a date YYYY-MM-DD.');
    }
    const dashboardText = posthogClient.optionalText(propsValue.dashboardId);
    const dashboardId = dashboardText === undefined ? undefined : Number(posthogClient.numericId({ value: dashboardText, label: 'Dashboard ID' }));
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: posthogClient.projectPath({ auth: auth.props, segments: ['insights'] }),
      body: {
        name,
        description: posthogClient.optionalText(propsValue.description) ?? '',
        saved: true,
        query: {
          kind: 'InsightVizNode',
          source: {
            kind: 'TrendsQuery',
            series: [{ kind: 'EventsNode', event, name: event, math }],
            interval,
            dateRange: { date_from: dateFrom },
            trendsFilter: { display },
          },
        },
        ...(dashboardId === undefined ? {} : { dashboards: [dashboardId] }),
      },
    });
    const r = posthogClient.recordOf(body);
    const shortId = posthogClient.str(r['short_id']);
    return {
      id: posthogClient.num(r['id']),
      shortId,
      name: posthogClient.str(r['name']),
      description: posthogClient.str(r['description']),
      query: posthogClient.isRecord(r['query']) ? r['query'] : null,
      dashboardIds: posthogClient.arrayOf(r['dashboards']).filter((d): d is number => typeof d === 'number'),
      createdAt: posthogClient.str(r['created_at']),
      url: shortId === null ? null : posthogMappers.webUrl({ auth: auth.props, path: ['insights', shortId] }),
    };
  },
});
