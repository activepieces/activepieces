import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { oncehubAuth } from '../common/auth';
export const bookingNoshow = createTrigger({
  auth: oncehubAuth,
  name: 'bookingNoshow',
  displayName: 'Booking No-Show',
  description: 'Triggered when User sets the completed booking to No-show',
  props: {},
  sampleData: {
    id: 'EVNT-KN56U3YL7C',
    object: 'event',
    creation_time: '2020-03-22T09:49:12Z',
    type: 'booking.no_show',
    api_version: 'v2',
    data: {
      object: 'booking',
      id: 'BKNG-J4FR05BKEWEX',
      tracking_id: 'D36E0002',
      subject: 'Live demo',
      status: 'scheduled',
      in_trash: false,
      creation_time: '2020-03-22T09:48:48Z',
      starting_time: '2020-03-22T04:30:00Z',
      customer_timezone: 'America/New_York',
      last_updated_time: '2020-03-22T09:48:48Z',
      '...': '[Additional Properties Truncated]',
      owner: {
        first_name: 'Andrea',
        last_name: 'Hartie',
        email: 'AndreaHartie@example.com',
        role_name: 'Member',
        timezone: 'America/Chicago',
        teams: ['TM-GCJU8DLBTPY1'],
      },
      contact: {
        object: 'contact',
        id: 'CTC-J4FR05BKEW',
        creation_time: '2020-03-22T09:48:48Z',
        last_updated_time: '2020-03-22T09:48:48Z',
        last_interacted_time: null,
        owner: 'USR-FSD423423',
        status: 'Qualified',
        city: 'New York',
        company_size: '50-100',
        company: 'Acme Inc',
        country: 'United States',
        email: 'carrie.customer@gmail.com',
        employees: 1,
        first_name: 'Carrie',
        has_consent: false,
        job_title: 'Executive Assistant',
        last_name: 'Customer',
        mobile_phone: '+12025550195',
        phone: '+12025550100',
        post_code: '10001',
        salutation: 'Ms.',
        state: 'New York',
        street_address: '123 Main Street',
        terms_of_sevice: false,
        timezone: 'America/New_York',
        custom_fields: [],
      },
      conversation: {
        id: 'CVR-022EAEA41C',
        object: 'conversation',
        creation_time: '2021-07-13T12:28:24Z',
        initiated_by: 'contact',
        last_updated_time: '2021-07-13T12:33:54Z',
        last_interacted_time: '2021-07-13T12:33:54Z',
        contact: 'CTC-9QEG09XXYN',
        owner: 'USR-GNSBE50D6A',
        status: 'closed',
        bot: 'BOT-62774A40FB',
        '...': '[Additional Properties Truncated]',
      },
      cancel_reschedule_url: 'https://oncehub.com/m/BKNG-3KM0HY2BF9SL',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const api_key = context.auth.secret_text;
    const { webhookUrl } = context;

    const response = await makeRequest(api_key, HttpMethod.POST, '/webhooks', {
      url: webhookUrl,
      name: `Booking No-Show Webhook - ${new Date().getTime()}`,
      events: ['booking.no_show'],
    });

    await context.store.put('webhookId_bookingNoshow', response.id);
  },
  async onDisable(context) {
    const api_key = context.auth.secret_text;
    const webhookId = await context.store.get<string>(
      'webhookId_bookingNoshow'
    );

    if (webhookId) {
      await makeRequest(api_key, HttpMethod.DELETE, `/webhooks/${webhookId}`);
    }

    await context.store.delete('webhookId_bookingNoshow');
  },
  async run(context) {
    return [context.payload.body];
  },
});
