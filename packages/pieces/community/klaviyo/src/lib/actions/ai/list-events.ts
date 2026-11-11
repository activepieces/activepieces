import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../common/auth';
import { equalsFilter, joinFilters, klaviyoApi } from '../../common/client';
import { klaviyoInputs } from '../../common/ai-props';
import { klaviyoOutputSchemas } from '../../common/output-schemas';

export const listEventsAi = createAction({
  auth: klaviyoAuth,
  name: 'list_events_ai',
  classification: 'SEARCH',
  displayName: 'List Events',
  description: 'List Klaviyo events, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Klaviyo events (activity such as orders, opens or tracked custom events) with their properties, optionally for one metric, one profile and a time range. Find the metric ID with List Metrics and the profile ID with Find Profile by Email/Phone. Times are the event time, not when Klaviyo received it. Pass next_cursor back as cursor for more. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: klaviyoOutputSchemas.aiEventPage,
  props: {
    metric_id: Property.ShortText({ displayName: 'Metric ID', description: 'Only events of this metric. Get it from List Metrics.', required: false }),
    profile_id: Property.ShortText({ displayName: 'Profile ID', description: 'Only events of this profile.', required: false }),
    since: Property.ShortText({ displayName: 'Since', description: 'ISO 8601 date-time with timezone; events at or after it.', required: false }),
    until: Property.ShortText({ displayName: 'Until', description: 'ISO 8601 date-time with timezone; events before it.', required: false }),
    sort: Property.StaticDropdown<string>({
      displayName: 'Sort',
      description: 'Order by event time. Omit for Klaviyo default order.',
      required: false,
      options: {
        options: [
          { label: 'Oldest first', value: 'datetime' },
          { label: 'Newest first', value: '-datetime' },
        ],
      },
    }),
    page_size: klaviyoInputs.pageSizeProp({ max: 100, defaultValue: 20 }),
    cursor: klaviyoInputs.cursorProp(),
  },
  async run({ auth, propsValue }) {
    const metricId = klaviyoInputs.optionalText(propsValue.metric_id);
    const profileId = klaviyoInputs.optionalText(propsValue.profile_id);
    const since = klaviyoInputs.isoDateTime({ value: propsValue.since, label: 'Since' });
    const until = klaviyoInputs.isoDateTime({ value: propsValue.until, label: 'Until' });
    const sort = klaviyoInputs.oneOf({ value: propsValue.sort, label: 'Sort', allowed: ['datetime', '-datetime'] });
    const page = await klaviyoApi.listPage({
      auth,
      path: '/events',
      query: {
        filter: joinFilters([
          metricId === undefined ? undefined : equalsFilter({ field: 'metric_id', value: metricId }),
          profileId === undefined ? undefined : equalsFilter({ field: 'profile_id', value: profileId }),
          since === undefined ? undefined : `greater-or-equal(datetime,${since})`,
          until === undefined ? undefined : `less-than(datetime,${until})`,
        ]),
        sort,
        'page[size]': klaviyoInputs.pageSize({ value: propsValue.page_size, max: 100, defaultValue: 20 }),
      },
      cursor: klaviyoInputs.optionalText(propsValue.cursor),
    });
    return klaviyoInputs.pageOutput({ page, map: klaviyoInputs.flatEvent });
  },
});
