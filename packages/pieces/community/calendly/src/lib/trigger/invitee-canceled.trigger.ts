import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { calendlyCommon, CalendlyWebhookInformation } from '../common';
import { calendlyAuth } from '../../';

const triggerNameInStore = 'calendly_invitee_canceled_trigger';

export const calendlyInviteeCanceled = createTrigger({
  auth: calendlyAuth,
  name: 'invitee_canceled',
  displayName: 'Event Canceled',
  description: 'Triggers when a new Calendly event is canceled',
  props: {
    scope: calendlyCommon.scope,
  },
  sampleData: {
    created_at: '2023-01-29T13:57:17.000000Z',
    created_by: 'https://api.calendly.com/users/AAAAAAA',
    event: 'invitee.canceled',
    payload: {
      cancel_url: 'https://calendly.com/cancellations/AAAAAAAA',
      cancellation: {
        canceler_type: 'host',
        canceled_by: 'Ashraf Samhouri',
        reason: 'testing',
      },
      created_at: '2023-01-29T13:56:46.894198Z',
      email: 'test@test.com',
      event: 'https://api.calendly.com/scheduled_events/AAAAAAAAA',
      first_name: null,
      last_name: null,
      name: 'abdul',
      new_invitee: null,
      no_show: null,
      old_invitee: null,
      payment: null,
      questions_and_answers: [],
      reconfirmation: null,
      reschedule_url: 'https://calendly.com/reschedulings/AAAAAAAA',
      rescheduled: false,
      routing_form_submission: null,
      status: 'canceled',
      text_reminder_number: null,
      timezone: 'Asia/Baghdad',
      tracking: {
        utm_campaign: null,
        utm_source: null,
        utm_medium: null,
        utm_content: null,
        utm_term: null,
        salesforce_uuid: null,
      },
      updated_at: '2023-01-29T13:57:17.466943Z',
      uri: 'https://api.calendly.com/scheduled_events/AAAAAAAAAAAaA/invitees/AAAAAAAA',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const calendlyUser = await calendlyCommon.getUser(context.auth);
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${calendlyCommon.baseUrl}/webhook_subscriptions`,
      body: {
        url: context.webhookUrl,
        organization: calendlyUser.current_organization,
        user: calendlyUser.uri,
        scope: context.propsValue.scope,
        events: ['invitee.canceled'],
      },
      authentication: {
        token: context.auth,
        type: AuthenticationType.BEARER_TOKEN,
      },
      queryParams: {},
    };
    const { body } = await httpClient.sendRequest<{
      resource: { uri: string };
    }>(request);
    await context.store?.put<CalendlyWebhookInformation>(triggerNameInStore, {
      webhookId: calendlyCommon.UuidFromUri(body.resource.uri)!,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<CalendlyWebhookInformation>(
      triggerNameInStore
    );
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${calendlyCommon.baseUrl}/webhook_subscriptions/${response.webhookId}`,
        authentication: {
          token: context.auth,
          type: AuthenticationType.BEARER_TOKEN,
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
