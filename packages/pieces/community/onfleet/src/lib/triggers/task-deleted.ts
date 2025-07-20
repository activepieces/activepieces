import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const taskDeleted = createTrigger({
  auth: onfleetAuth,
  name: 'task_deleted',
  displayName: 'Task Deleted',
  description: 'Triggers when a task is deleted',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.TASK_DELETED
    );

    await context.store?.put('_task_deleted_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_task_deleted_trigger');

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
      id: 'vjw*RDMKDljKVDve1Vtcplgu',
      type: 'ADMIN',
    },
    adminId: 'vjw*RDMKDljKVDve1Vtcplgu',
    data: {
      task: {
        appearance: {
          triangleColor: null,
        },
        completeAfter: null,
        completeBefore: 1613008800000,
        completionDetails: {
          actions: [],
          events: [],
          failureNotes: '',
          failureReason: 'NONE',
          firstLocation: [],
          lastLocation: [],
          time: null,
          unavailableAttachments: [],
        },
        container: {
          organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
          type: 'ORGANIZATION',
        },
        creator: 'vjw*RDMKDljKVDve1Vtcplgu',
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
          id: 'pJcfO7NRJaor~Tl8ggBHrveJ',
          location: [-117.8764687, 33.8078476],
          metadata: [],
          notes: 'This is a destination note',
          timeCreated: 1613004115000,
          timeLastModified: 1613004115635,
        },
        executor: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        feedback: [],
        id: '3C0W9uLyWC5R4V5fuj7bzJpk',
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
        shortId: '9ad82b23',
        sourceTaskId: 'txiK2xHBIaUwAKB~BJrjscKu',
        state: 0,
        timeCreated: 1613004116000,
        timeLastModified: 1613004116038,
        trackingURL: 'https://onf.lt/9ad82b2380',
        trackingViewed: false,
        worker: null,
      },
    },
    taskId: '3C0W9uLyWC5R4V5fuj7bzJpk',
    time: 1613004265027,
    triggerId: 8,
    triggerName: 'taskDeleted',
    workerId: null,
  },
});
