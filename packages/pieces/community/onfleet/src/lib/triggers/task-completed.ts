import {
  TriggerStrategy,
  WebhookHandshakeStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';

export const taskCompleted = createTrigger({
  auth: onfleetAuth,
  name: 'task_completed',
  displayName: 'Task Completed',
  description: 'Triggers when a task is completed',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.TASK_COMPLETED
    );

    await context.store?.put('_task_completed_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_task_completed_trigger');

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
    actionContext: {
      id: 'COwfwH~Zogm1LXIZYbPlLAyw',
      type: 'WORKER',
    },
    adminId: null,
    data: {
      task: {
        appearance: {
          triangleColor: null,
        },
        completeAfter: null,
        completeBefore: 1613008800000,
        completionDetails: {
          actions: [],
          events: [
            {
              name: 'start',
              time: 1613004620434,
            },
          ],
          failureNotes: '',
          failureReason: 'NONE',
          firstLocation: [],
          lastLocation: [],
          notes: 'this is a completed note',
          photoUploadId: null,
          photoUploadIds: [],
          signatureUploadId: null,
          success: true,
          time: 1613004642071,
          unavailableAttachments: [],
        },
        creator: 'vjw*RDMKDljKVDve1Vtcplgu',
        delayTime: null,
        dependencies: [],
        destination: {
          address: {
            apartment: '',
            city: 'Anaheim',
            country: 'United States',
            name: 'Honda Center',
            number: '2695',
            postalCode: '92806',
            state: 'California',
            street: 'East Katella Avenue',
          },
          id: 'ycrp3Omwm0qhS2F725DaLsfM',
          location: [-117.8764687, 33.8078476],
          metadata: [],
          notes: 'This is a destination note',
          timeCreated: 1613004583000,
          timeLastModified: 1613004583735,
        },
        estimatedArrivalTime: null,
        estimatedCompletionTime: null,
        executor: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        feedback: [],
        id: 'WGpUvHMTSrwZh*lqtTIt9iSW',
        identity: {
          checksum: null,
          failedScanCount: 0,
        },
        merchant: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        metadata: [],
        notes: 'This is a Task note',
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        overrides: {},
        pickupTask: false,
        quantity: 1,
        recipients: [
          {
            id: 'A~pBTrc5~dTMBBImswg7U4YT',
            metadata: [],
            name: 'Test User One',
            notes: 'This is a recipient note',
            organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
            phone: '+17145554231',
            skipSMSNotifications: false,
            timeCreated: 1613002583000,
            timeLastModified: 1613002583931,
          },
        ],
        serviceTime: 3,
        shortId: 'b7f82a36',
        sourceTaskId: 'txiK2xHBIaUwAKB~BJrjscKu',
        state: 3,
        timeCreated: 1613004583000,
        timeLastModified: 1613004642099,
        trackingURL: 'https://onf.lt/b7f82a36cf',
        trackingViewed: false,
        worker: 'COwfwH~Zogm1LXIZYbPlLAyw',
      },
    },
    taskId: 'WGpUvHMTSrwZh*lqtTIt9iSW',
    time: 1613004642136,
    triggerId: 3,
    triggerName: 'taskCompleted',
    workerId: 'COwfwH~Zogm1LXIZYbPlLAyw',
  },
});
