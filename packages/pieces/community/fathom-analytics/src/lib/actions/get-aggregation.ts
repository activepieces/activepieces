import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

const ENTITY_OPTIONS = [
  { label: 'Pageview', value: 'pageview' },
  { label: 'Event', value: 'event' },
];

const AGGREGATION_OPTIONS = [
  { label: 'Pageviews', value: 'pageviews' },
  { label: 'Visits', value: 'visits' },
  { label: 'Uniques', value: 'uniques' },
  { label: 'Avg Duration', value: 'avg_duration' },
  { label: 'Bounce Rate', value: 'bounce_rate' },
];

const DATE_GROUPING_OPTIONS = [
  { label: 'Hour', value: 'hour' },
  { label: 'Day', value: 'day' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
];


const FIELD_GROUPING_OPTIONS = [
  { label: 'Pathname', value: 'pathname' },
  { label: 'Hostname', value: 'hostname' },
  { label: 'Referrer Hostname', value: 'referrer_hostname' },
  { label: 'Referrer Pathname', value: 'referrer_pathname' },
  { label: 'Browser', value: 'browser' },
  { label: 'Browser Version', value: 'browser_version' },
  { label: 'Device Type', value: 'device_type' },
  { label: 'Country Code', value: 'country_code' },
  { label: 'UTM Source', value: 'utm_source' },
  { label: 'UTM Medium', value: 'utm_medium' },
  { label: 'UTM Campaign', value: 'utm_campaign' },
  { label: 'UTM Term', value: 'utm_term' },
  { label: 'UTM Content', value: 'utm_content' },
];

export const getAggregation = createAction({
  name: 'get_aggregation',
  displayName: 'Get Aggregation',
  description:
    'Generate a custom analytics aggregation report. Supports flexible grouping, filtering, and date ranges.',
  auth: fathomAuth,
  props: {
    entity_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The Fathom site ID to query (e.g., CDBUGS). Required for pageview entity. Do not include when entity is set to event.',
      required: false,
    }),
    entity: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Whether to aggregate pageviews or events.',
      required: true,
      options: {
        options: ENTITY_OPTIONS,
      },
      defaultValue: 'pageview',
    }),
    aggregates: Property.StaticMultiSelectDropdown({
      displayName: 'Aggregates',
      description: 'The metrics to include in the report.',
      required: true,
      options: {
        options: AGGREGATION_OPTIONS,
      },
    }),
    date_grouping: Property.StaticDropdown({
      displayName: 'Date Grouping',
      description: 'Group results by this time unit.',
      required: false,
      options: {
        options: DATE_GROUPING_OPTIONS,
      },
    }),
    field_grouping: Property.StaticDropdown({
      displayName: 'Field Grouping',
      description: 'Group results by this field (e.g., pathname, browser). Makes the report actionable by breaking down totals.',
      required: false,
      options: {
        options: FIELD_GROUPING_OPTIONS,
      },
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description: 'Start date for the report in ISO 8601 format (e.g., 2024-01-01T00:00:00.000000Z).',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description: 'End date for the report in ISO 8601 format (e.g., 2024-12-31T23:59:59.999999Z).',
      required: false,
    }),
    sort_by: Property.ShortText({
      displayName: 'Sort By',
      description: 'Field to sort by (e.g., "pageviews:desc").',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return.',
      required: false,
      defaultValue: 20,
    }),
    filters: Property.Json({
      displayName: 'Filters',
      description:
        'Optional array of filter objects. Example: [{"property": "pathname", "operator": "is", "value": "/blog"}]',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const queryParams: Record<string, string> = {
      entity: propsValue.entity,
      aggregates: Array.isArray(propsValue.aggregates)
        ? propsValue.aggregates.join(',')
        : String(propsValue.aggregates),
    };

    if (propsValue.entity !== 'event' && propsValue.entity_id) {
      queryParams['entity_id'] = propsValue.entity_id;
    }

    if (propsValue.date_grouping) {
      queryParams['date_grouping'] = propsValue.date_grouping;
    }
    if (propsValue.field_grouping) {
      queryParams['field_grouping'] = propsValue.field_grouping;
    }
    if (propsValue.date_from) {
      queryParams['date_from'] = propsValue.date_from;
    }
    if (propsValue.date_to) {
      queryParams['date_to'] = propsValue.date_to;
    }
    if (propsValue.sort_by) {
      queryParams['sort_by'] = propsValue.sort_by;
    }
    if (propsValue.limit != null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.filters) {
      queryParams['filters'] = JSON.stringify(propsValue.filters);
    }

    const response = await httpClient.sendRequest<Array<Record<string, unknown>>>({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/aggregations`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      queryParams,
    });

    return response.body;
  },
});
