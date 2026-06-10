import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';
import {
  AGGREGATION_OPTIONS,
  DATE_GROUPING_OPTIONS,
  ENTITY_OPTIONS,
  FIELD_GROUPING_OPTIONS,
} from '../common';

export const getAggregation = createAction({
  name: 'get_aggregation',
  displayName: 'Get Aggregation',
  description:
    'Generate a custom analytics aggregation report. Supports flexible grouping, filtering, and date ranges.',
  auth: fathomAuth,
  props: {
    entity: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'Whether to aggregate pageviews or events.',
      required: true,
      options: {
        options: ENTITY_OPTIONS,
      },
      defaultValue: 'pageview',
    }),
    entity_id: Property.ShortText({
      displayName: 'Site ID (for Pageviews)',
      description:
        'The Fathom site ID to query (e.g., CDBUGS). Required when Entity Type is "Pageview".',
      required: false,
    }),
    site_id: Property.ShortText({
      displayName: 'Site ID (for Events)',
      description:
        'The Fathom site ID that owns the event. Required when Entity Type is "Event".',
      required: false,
    }),
    entity_name: Property.ShortText({
      displayName: 'Event ID',
      description:
        'The ID of the specific event to aggregate. Required when Entity Type is "Event". Find event IDs via the List Events action.',
      required: false,
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
      description:
        'Group results by this field (e.g., pathname, browser). Makes the report actionable by breaking down totals.',
      required: false,
      options: {
        options: FIELD_GROUPING_OPTIONS,
      },
    }),
    date_from: Property.ShortText({
      displayName: 'Date From',
      description:
        'Start date for the report in ISO 8601 format (e.g., 2024-01-01T00:00:00.000000Z).',
      required: false,
    }),
    date_to: Property.ShortText({
      displayName: 'Date To',
      description:
        'End date for the report in ISO 8601 format (e.g., 2024-12-31T23:59:59.999999Z).',
      required: false,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description:
        'Timezone for the report (e.g., "America/New_York", "Europe/London"). Defaults to UTC.',
      required: false,
    }),
    sort_by: Property.ShortText({
      displayName: 'Sort By',
      description:
        'Field and direction to sort by (e.g., "pageviews:desc" or "uniques:asc").',
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

    if (propsValue.entity === 'event') {
      if (propsValue.site_id) queryParams['site_id'] = propsValue.site_id;
      if (propsValue.entity_name)
        queryParams['entity_name'] = propsValue.entity_name;
    } else {
      if (propsValue.entity_id) queryParams['entity_id'] = propsValue.entity_id;
    }

    if (propsValue.date_grouping)
      queryParams['date_grouping'] = propsValue.date_grouping;
    if (propsValue.field_grouping)
      queryParams['field_grouping'] = propsValue.field_grouping;
    if (propsValue.date_from) queryParams['date_from'] = propsValue.date_from;
    if (propsValue.date_to) queryParams['date_to'] = propsValue.date_to;
    if (propsValue.timezone) queryParams['timezone'] = propsValue.timezone;
    if (propsValue.sort_by) queryParams['sort_by'] = propsValue.sort_by;
    if (propsValue.limit != null)
      queryParams['limit'] = String(propsValue.limit);
    if (propsValue.filters)
      queryParams['filters'] = JSON.stringify(propsValue.filters);

    const response = await httpClient.sendRequest<
      Array<Record<string, unknown>>
    >({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/aggregations`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
      queryParams,
    });

    return response.body;
  },
});
