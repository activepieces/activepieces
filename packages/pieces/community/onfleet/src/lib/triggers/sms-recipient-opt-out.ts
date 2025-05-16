import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const smsRecipientOptOut = createTrigger({
  auth: onfleetAuth,
  name: 'sms_recipient_opt_out',
  displayName: 'SMS Recipient Opt Out',
  description: 'Triggers when a recipient opts out of SMS notifications',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.SMS_RECIPIENT_OPT_OUT
    );

    await context.store?.put('_sms_recipient_opt_out_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get(
      '_sms_recipient_opt_out_trigger'
    );

    if (response !== null && response !== undefined) {
      await common.unsubscribeWebhook(context.auth, response.webhookId);
    }
  },
  //Return task
  async run(context) {
    return [context.payload.body];
  },

  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'check',
  },

  async onHandshake(context) {
    return {
      status: 200,
      body: context.payload.queryParams['check'],
    };
  },

  sampleData: {
    recipient: {
      id: '7LecFRKJw7ExfyhBsi9h0NXW',
      name: 'Joe Smith',
      phone: '+17145555768',
    },
    timestamp: 1632432776621,
    SMS: 'STOP',
    triggerId: 17,
    triggerName: 'SMSRecipientOptOut',
    taskId: null,
    workerId: null,
    adminId: null,
    data: {},
    actionContext: null,
    time: 1632432776640,
  },
});
