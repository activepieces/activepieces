import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const taskDelayed = createTrigger({
  auth: onfleetAuth,
  name: 'task_delayed',
  displayName: 'Task Delayed',
  description: 'Triggers when a task is delayed',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.TASK_DELAYED
    );

    await context.store?.put('_task_delayed_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_task_delayed_trigger');

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
      task: {
        appearance: {
          triangleColor: null,
        },
        completeAfter: 1613160000000,
        completeBefore: 1613179800000,
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
          type: 'WORKER',
          worker: 'COwfwH~Zogm1LXIZYbPlLAyw',
        },
        creator: 'vjw*RDMKDljKVDve1Vtcplgu',
        dependencies: [],
        destination: {
          address: {
            apartment: '',
            city: 'Irvine',
            country: 'United States',
            name: 'University of California Irvine, Irvine, CA, USA',
            number: '',
            postalCode: '92697',
            state: 'California',
            street: '',
          },
          id: '134VHJhnXUqOmaFdISY0r6BD',
          location: [-117.8442962, 33.6404952],
          metadata: [],
          notes: '',
          timeCreated: 1613177955000,
          timeLastModified: 1613177955586,
        },
        estimatedArrivalTime: 1613180322638,
        estimatedCompletionTime: 1613180322638,
        executor: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        feedback: [],
        id: 'zIeGIBZQZhTRHaK6V6V74Fpg',
        identity: {
          checksum: null,
          failedScanCount: 0,
        },
        merchant: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        metadata: [],
        notes: '',
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        overrides: {},
        pickupTask: false,
        quantity: 0,
        recipients: [
          {
            id: '7LecFRKJw7ExfyhBsi9h0NXW',
            metadata: [],
            name: 'Brodie Lee',
            notes: 'Notes do not change *edited* more new notes',
            organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
            phone: '+17145555678',
            skipSMSNotifications: false,
            timeCreated: 1592005264000,
            timeLastModified: 1613177955599,
          },
        ],
        serviceTime: 0,
        shortId: 'a79d22fb',
        state: 2,
        timeCreated: 1613177955000,
        timeLastModified: 1613178053658,
        trackingURL: 'https://onf.lt/a79d22fb77',
        trackingViewed: false,
        worker: 'COwfwH~Zogm1LXIZYbPlLAyw',
      },
    },
    delay: 522.6378813476563,
    taskId: 'zIeGIBZQZhTRHaK6V6V74Fpg',
    time: 1613178058862,
    triggerId: 12,
    triggerName: 'taskDelayed',
    workerId: null,
  },
});
