import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { produktlyApiCall } from '../common/client';
import { produktlyAuth } from '../common/auth';

export const getWidgetStats = createAction({
  auth: produktlyAuth,
  name: 'get_widget_stats',
  displayName: 'Get Widget Stats',
  description: 'Get event and unique-user statistics for a specific entity type (e.g. all changelogs, all NPS widgets).',
  props: {
    entity_type: Property.StaticDropdown({
      displayName: 'Entity Type',
      description: 'The Produktly feature to get stats for.',
      required: true,
      options: {
        options: [
          { label: 'Product Tour', value: 'tour' },
          { label: 'Checklist', value: 'checklist' },
          { label: 'Smart Tip', value: 'smartTip' },
          { label: 'Announcement', value: 'announcement' },
          { label: 'Changelog', value: 'changelog' },
          { label: 'NPS Widget', value: 'npsWidget' },
          { label: 'Roadmap', value: 'roadmap' },
        ],
      },
    }),
    entity_id: Property.Number({
      displayName: 'Entity ID',
      description: 'Optional. Filter stats to a single entity of the chosen type (e.g. a specific changelog ID).',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'Optional ISO 8601 date for the start of the period (e.g. 2024-01-01).',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'Optional ISO 8601 date for the end of the period (e.g. 2024-12-31).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.entity_id !== undefined) queryParams['entityId'] = String(propsValue.entity_id);
    if (propsValue.start_date) queryParams['startDate'] = propsValue.start_date;
    if (propsValue.end_date) queryParams['endDate'] = propsValue.end_date;
    const response = await produktlyApiCall<{
      entityType: string;
      period: { start: string; end: string };
      widgets: Array<{
        entityId: number;
        name: string;
        archivedAt: string;
        events: Record<string, { count: number; uniqueUsers: number }>;
        totalEvents: number;
        totalUniqueUsers: number;
      }>;
    }>({
      auth,
      method: HttpMethod.GET,
      path: `/stats/widgets/${propsValue.entity_type}`,
      queryParams,
    });
    return {
      entity_type: response.body.entityType,
      period_start: response.body.period.start,
      period_end: response.body.period.end,
      widget_count: response.body.widgets.length,
      widgets: response.body.widgets.map((widget) => ({
        entity_id: widget.entityId,
        name: widget.name,
        archived_at: widget.archivedAt,
        total_events: widget.totalEvents,
        total_unique_users: widget.totalUniqueUsers,
        event_breakdown: Object.entries(widget.events)
          .map(([eventName, stats]) => `${eventName}: ${stats.count} (${stats.uniqueUsers} unique)`)
          .join(' | '),
      })),
    };
  },
});
