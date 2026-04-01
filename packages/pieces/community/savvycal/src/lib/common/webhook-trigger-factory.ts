import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, flattenEvent, SavvyCalEvent } from '.';
import { savvyCalAuth } from '../../';

const SAMPLE_EVENT = {
  id: 'evt_abc123',
  summary: '30 Minute Meeting with Jane Doe',
  description: null,
  state: 'confirmed',
  start_at: '2024-06-01T10:00:00Z',
  end_at: '2024-06-01T10:30:00Z',
  duration_minutes: 30,
  url: 'https://savvycal.com/events/evt_abc123',
  location: null,
  is_group_session: false,
  created_at: '2024-05-20T08:00:00Z',
  canceled_at: null,
  cancel_reason: null,
  rescheduled_at: null,
  reschedule_reason: null,
  original_start_at: null,
  original_end_at: null,
  scheduling_link_id: 'lnk_xyz789',
  scheduling_link_name: '30-Minute Meeting',
  scheduling_link_slug: '30min',
  attendee_display_name: 'Jane Doe',
  attendee_first_name: 'Jane',
  attendee_last_name: 'Doe',
  attendee_email: 'jane@example.com',
  attendee_phone: null,
  attendee_time_zone: 'America/Chicago',
  conferencing_type: 'zoom',
  conferencing_join_url: 'https://zoom.us/j/123456789',
  conferencing_meeting_id: '123456789',
  payment_state: null,
  payment_amount_total_cents: null,
};

export function createEventTrigger({
  name,
  displayName,
  description,
  eventType,
}: {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
}) {
  return createTrigger({
    auth: savvyCalAuth,
    name,
    displayName,
    description,
    props: {},
    sampleData: { event_type: eventType, ...SAMPLE_EVENT },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
      const response = await savvyCalApiCall<{ id: string; secret: string }>({
        token: context.auth.secret_text,
        method: HttpMethod.POST,
        path: '/webhooks',
        body: { url: context.webhookUrl },
      });
      await context.store.put('webhookId', response.body.id);
      await context.store.put('webhookSecret', response.body.secret);
    },

    async onDisable(context) {
      const webhookId = await context.store.get<string>('webhookId');
      if (webhookId) {
        await savvyCalApiCall({
          token: context.auth.secret_text,
          method: HttpMethod.DELETE,
          path: `/webhooks/${webhookId}`,
        });
      }
    },

    async run(context) {
      const body = context.payload.body as { type: string; payload: SavvyCalEvent };
      if (body?.type !== eventType || !body?.payload) return [];
      return [{ event_type: body.type, ...flattenEvent(body.payload) }];
    },

    async test(context) {
      const response = await savvyCalApiCall<{ entries: SavvyCalEvent[] }>({
        token: context.auth.secret_text,
        method: HttpMethod.GET,
        path: '/events',
        queryParams: { limit: '5' },
      });
      return response.body.entries.map((e) => ({ event_type: eventType, ...flattenEvent(e) }));
    },
  });
}
