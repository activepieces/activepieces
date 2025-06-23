import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const workerDutyChange = createTrigger({
  auth: onfleetAuth,
  name: 'worker_duty_change',
  displayName: 'Worker Duty Change',
  description: 'Triggers when a worker status changes',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.WORKER_DUTY_CHANGE
    );

    await context.store?.put('_worker_duty_change_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get(
      '_worker_duty_change_trigger'
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
    actionContext: null,
    adminId: null,
    data: {
      worker: {
        accountStatus: 'ACCEPTED',
        activeTask: null,
        capacity: 3,
        delayTime: null,
        displayName: '',
        hasRecentlyUsedSpoofedLocations: false,
        id: 'COwfwH~Zogm1LXIZYbPlLAyw',
        imageUrl: null,
        location: null,
        metadata: [],
        name: 'Shured Shuanger',
        onDuty: true,
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        phone: '+17145555678',
        tasks: ['txiK2xHBIaUwAKB~BJrjscKu'],
        teams: ['K3FXFtJj2FtaO2~H60evRrDc'],
        timeCreated: 1585254830000,
        timeLastModified: 1613003712585,
        timeLastSeen: 1613003870027,
        timezone: 'America/Los_Angeles',
        userData: {
          appVersion: '2.1.11.1',
          batteryLevel: 0.64,
          deviceDescription: 'Google Pixel 2 (Android 11)',
          platform: 'ANDROID',
        },
        vehicle: {
          color: '',
          description: '',
          id: 'Dib0eZfs*uJhJmWHKL~tExub',
          licensePlate: '',
          timeLastModified: 1612226873144,
          type: 'CAR',
        },
      },
    },
    status: 1,
    taskId: null,
    time: 1613003870062,
    triggerId: 5,
    triggerName: 'workerDuty',
    workerId: 'COwfwH~Zogm1LXIZYbPlLAyw',
  },
});
