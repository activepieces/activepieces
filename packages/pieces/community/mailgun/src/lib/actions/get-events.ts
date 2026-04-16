import { createAction, Property } from '@activepieces/pieces-framework';
import { mailgunAuth } from '../..';
import { mailgunCommon, mailgunApiCall, mailgunApiCallAbsoluteUrl } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getEvents = createAction({
  auth: mailgunAuth,
  name: 'get_events',
  displayName: 'Get Events',
  description:
    'Retrieve email events from your Mailgun domain (deliveries, failures, opens, clicks, etc.). Useful for monitoring and alerting.',
  props: {
    domain: mailgunCommon.domainDropdown,
    event: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Filter events by type.',
      required: true,
      options: {
        options: [
          { label: 'Failed (permanent + temporary)', value: 'failed' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Accepted', value: 'accepted' },
          { label: 'Rejected', value: 'rejected' },
          { label: 'Opened', value: 'opened' },
          { label: 'Clicked', value: 'clicked' },
          { label: 'Complained', value: 'complained' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Stored', value: 'stored' },
        ],
      },
    }),
    severity: Property.StaticDropdown({
      displayName: 'Severity',
      description:
        'Only applies to "failed" events. Filter by permanent (hard bounce) or temporary (soft bounce).',
      required: false,
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Permanent (hard bounce)', value: 'permanent' },
          { label: 'Temporary (soft bounce)', value: 'temporary' },
        ],
      },
    }),
    begin: Property.ShortText({
      displayName: 'Begin Date',
      description:
        'Start of the time range. RFC 2822 date (e.g. "Fri, 28 Mar 2026 10:00:00 -0000") or Unix timestamp (e.g. "1711620000"). Leave empty for Mailgun default (about 30 days ago).',
      required: false,
    }),
    end: Property.ShortText({
      displayName: 'End Date',
      description:
        'End of the time range. Same format as Begin Date. Leave empty for now.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description:
        'Maximum number of events to return. Default is 100, max is 1000. Mailgun returns up to 300 per page — pagination is handled automatically.',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { domain, event, severity, begin, end, limit } =
      context.propsValue;
    const auth = context.auth;
    const maxResults = Math.min(Math.max(limit ?? 100, 1), 1000);
    const pageSize = Math.min(maxResults, 300);

    const queryParams: Record<string, string> = {
      event,
      limit: String(pageSize),
    };
    if (severity) queryParams['severity'] = severity;
    if (begin) queryParams['begin'] = begin;
    if (end) queryParams['end'] = end;

    const allItems: Record<string, unknown>[] = [];

    const firstResponse = await mailgunApiCall<EventsResponse>({
      apiKey: auth.props.api_key,
      region: auth.props.region,
      method: HttpMethod.GET,
      path: `/v3/${domain}/events`,
      queryParams,
    });

    allItems.push(...firstResponse.body.items);

    let nextUrl = firstResponse.body.paging?.next ?? null;
    while (nextUrl && allItems.length < maxResults) {
      const pageResponse = await mailgunApiCallAbsoluteUrl<EventsResponse>({
        apiKey: auth.props.api_key,
        url: nextUrl,
      });
      if (!pageResponse.body.items || pageResponse.body.items.length === 0) {
        break;
      }
      allItems.push(...pageResponse.body.items);
      nextUrl = pageResponse.body.paging?.next ?? null;
    }

    const events = allItems.slice(0, maxResults).map(flattenEvent);

    return {
      total_count: events.length,
      events,
    };
  },
});

function flattenEvent(item: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {
    event: item['event'] ?? null,
    id: item['id'] ?? null,
    timestamp: item['timestamp'] ?? null,
    recipient: item['recipient'] ?? null,
    domain: item['domain'] ?? null,
    log_level: item['log-level'] ?? null,
    severity: item['severity'] ?? null,
    reason: item['reason'] ?? null,
  };

  const message = item['message'] as Record<string, unknown> | undefined;
  if (message) {
    const headers = message['headers'] as Record<string, unknown> | undefined;
    if (headers) {
      result['message_id'] = headers['message-id'] ?? null;
      result['from'] = headers['from'] ?? null;
      result['to'] = headers['to'] ?? null;
      result['subject'] = headers['subject'] ?? null;
    }
  }

  const deliveryStatus = item['delivery-status'] as Record<string, unknown> | undefined;
  if (deliveryStatus) {
    result['delivery_status_code'] = deliveryStatus['code'] ?? null;
    result['delivery_status_message'] = deliveryStatus['message'] ?? null;
    result['delivery_status_description'] = deliveryStatus['description'] ?? null;
  }

  const tags = item['tags'] as string[] | undefined;
  result['tags'] = Array.isArray(tags) ? tags.join(', ') : null;

  return result;
}

type EventsResponse = {
  items: Record<string, unknown>[];
  paging: { next: string };
};
