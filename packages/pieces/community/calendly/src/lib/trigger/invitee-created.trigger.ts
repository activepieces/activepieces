import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  AuthenticationType,
  httpClient,
} from '@activepieces/pieces-common';
import { calendlyCommon, CalendlyWebhookInformation } from '../common';
import { calendlyAuth } from '../../';

const triggerNameInStore = 'calendly_invitee_created_trigger';

export const calendlyInviteeCreated = createTrigger({
  auth: calendlyAuth,
  name: 'invitee_created',
  displayName: 'Event Scheduled',
  description: 'Triggers when a new Calendly event is scheduled',
  props: {
    scope: calendlyCommon.scope,
  },
  sampleData: {
    created_at: '2023-01-29T13:50:13.000000Z',
    created_by: 'https://api.calendly.com/users/AAAAAAAAAAAA',
    payload: {
      cancel_url: 'https://calendly.com/cancellations/AAAAAAAAAAA',
      created_at: '2023-01-29T13:50:13.072950Z',
      email: 'abdulyki@activepieces.com',
      event: 'https://api.calendly.com/scheduled_events/AAAAAAAAAAAA',
      first_name: null,
      last_name: null,
      name: 'abdul',
      new_invitee: null,
      no_show: null,
      old_invitee: null,
      payment: null,
      questions_and_answers: [],
      reconfirmation: null,
      reschedule_url: 'https://calendly.com/reschedulings/AAAAAAAAAAAA',
      rescheduled: false,
      routing_form_submission: null,
      status: 'active',
      text_reminder_number: null,
      timezone: 'Asia/Baghdad',
      updated_at: '2023-01-29T13:50:13.072950Z',
      uri: 'https://api.calendly.com/scheduled_events/AAAAAAAAAAAaA/invitees/AAAAAAAAAAAA',
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
        scope: context.propsValue['scope'],
        events: ['invitee.created'],
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
    console.log(response || 'nothing');
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
    } else {
      throw Error('context store was null');
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
