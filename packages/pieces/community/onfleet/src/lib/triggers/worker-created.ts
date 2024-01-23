import {
  TriggerStrategy,
  WebhookHandshakeStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';

export const workerCreated = createTrigger({
  auth: onfleetAuth,
  name: 'worker_created',
  displayName: 'Worker Created',
  description: 'Triggers when a worker is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.WORKER_CREATED
    );

    await context.store?.put('_worker_created_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_worker_created_trigger');

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
    adminId: 'i18uIpm5NNNw6nBL8QMW1JM7',
    workerId: 'sccpOkp3SassNmJxHjm1UFc5',
    actionContext: {
      id: 'i18uIpm5NNNw6nBL8QMW1JM7',
      type: 'ADMIN',
    },
    triggerId: 15,
    triggerName: 'workerCreated',
    taskId: null,
    data: {
      worker: {
        id: 'sccpOkp3SassNmJxHjm1UFc5',
        timeCreated: 1623274200000,
        timeLastModified: 1623274200799,
        organization: '1MWYTEQf6jioThhHhH4~KmVI',
        name: 'John Smith',
        displayName: '',
        phone: '+17145555768',
        activeTask: null,
        tasks: [],
        onDuty: false,
        timeLastSeen: null,
        capacity: 0,
        userData: {},
        accountStatus: 'INVITED',
        metadata: [],
        timezone: null,
        imageUrl: null,
        teams: ['QNwu7xmlvGHzAYXk2zmZocD2'],
        vehicle: {
          id: '3O7k6AmNVc5U8~AkgNRVxGTm',
          type: 'CAR',
          description: '1996 Honda Accord',
          licensePlate: null,
          color: 'Green',
          timeLastModified: 1623274200789,
        },
      },
    },
    time: 1623274200840,
  },
});
