import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaWebhook } from '../common/webhook';

const EVENT = 'appointment.created';

export const newAppointment = createTrigger({
  auth: genayaAuth,
  name: 'new_appointment',
  classification: 'READ',
  displayName: 'New Appointment',
  description: 'Triggers when an appointment is created in Genaya.',
  aiMetadata: {
    description:
      'Fires once for each new appointment (job, visit, session or project) created in Genaya. The payload is a summary of that appointment: schedule times, status, type, client contact details, address, assigned team, totals and custom fields.',
  },
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event_id: 'evt_4hN8mPzq1Vd6',
    event_type: 'appointment.created',
    event_created_at: '2026-08-04T15:12:00.000Z',
    organization_id: '9f2kX0aBcDeFgHiJ',
    object: 'appointment',
    id: '9Kd2pXq7Lm4',
    status: 'Submitted',
    previous_status: null,
    appointment_type: 'Consultation',
    scheduled_at: '2026-08-10T09:00:00-07:00',
    scheduled_at_local: '2026-08-10 09:00:00',
    ends_at: '2026-08-10T11:00:00-07:00',
    ends_at_local: '2026-08-10 11:00:00',
    unscheduled: false,
    number: 'QRCJGW',
    appointment_number: 178,
    description: 'Follow-up and parts replacement',
    sub_status: null,
    lead_source: 'Google Search',
    lead_source_cost: 21,
    service_area: 'Los Angeles',
    tags: 'VIP',
    assigned_team_names: 'Sarah Johnson',
    client_name: 'Jordan Rivera',
    client_phone: '+14155550142',
    client_email: 'jordan@example.com',
    client_company: 'Maple Lane Studio',
    client_secondary_phone: null,
    client_phone_ext: null,
    client_secondary_phone_ext: null,
    client_id: '4Bf1nWq2Jp9',
    address: '9979 Durant Drive',
    address_unit: 'Suite 4',
    address_city: 'Beverly Hills',
    address_state: 'CA',
    address_zip: '90212',
    address_country: 'US',
    latitude: 34.0632816,
    longitude: -118.4133315,
    vendor: null,
    payment_due_date: null,
    line_items_count: 2,
    line_items_summary: '2 x Labor (per hour) @ $81.81 = $163.62; 1 x Control Board @ $220 = $220',
    subtotal: 383.62,
    tax_rate: null,
    tax_name: null,
    tax_total: 0,
    total: 383.62,
    balance: 383.62,
    company_id: 'cmp_main',
    company_name: 'Downtown Branch',
    created_at: '2026-08-04T08:12:00-07:00',
    created_by_name: 'Alex Morgan',
  },
  async onEnable(context) {
    await genayaWebhook.subscribe({
      apiKey: context.auth.secret_text,
      webhookUrl: context.webhookUrl,
      event: EVENT,
      store: context.store,
    });
  },
  async onDisable(context) {
    await genayaWebhook.unsubscribe({ apiKey: context.auth.secret_text, store: context.store });
  },
  async run(context) {
    return genayaWebhook.handle({ payload: context.payload, store: context.store, event: EVENT });
  },
});
