import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const taskEta = createTrigger({
  auth: onfleetAuth,
  name: 'task_eta',
  displayName: 'Task ETA',
  description:
    'Triggers when a task worker ETA less than or equal to threshold value provided, in seconds',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.TASK_ETA
    );

    await context.store?.put('_task_eta_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_task_eta_trigger');

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
    taskId: 'hV2lAmBLs~76oXR4jYBjQbgY',
    etaSeconds: 298.2603148875159,
    triggerId: 1,
    triggerName: 'taskEta',
    workerId: null,
    adminId: null,
    data: {
      task: {
        id: 'hV2lAmBLs~76oXR4jYBjQbgY',
        timeCreated: 1615502820000,
        timeLastModified: 1615504576163,
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        shortId: 'a685d01d',
        trackingURL: 'https://onf.lt/a685d01d24',
        worker: 'COwfwH~Zogm1LXIZYbPlLAyw',
        merchant: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        executor: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        creator: 'vjw*RDMKDljKVDve1Vtcplgu',
        dependencies: [],
        state: 2,
        completeAfter: 1615492800000,
        completeBefore: 1615505400000,
        pickupTask: false,
        notes: '',
        completionDetails: {
          failureNotes: '',
          failureReason: 'NONE',
          events: [],
          actions: [],
          time: null,
          firstLocation: [],
          lastLocation: [],
          unavailableAttachments: [],
        },
        feedback: [],
        metadata: [],
        overrides: {},
        quantity: 0,
        serviceTime: 0,
        identity: {
          failedScanCount: 0,
          checksum: null,
        },
        appearance: {
          triangleColor: null,
        },
        container: {
          type: 'WORKER',
          worker: 'COwfwH~Zogm1LXIZYbPlLAyw',
        },
        trackingViewed: false,
        estimatedCompletionTime: 1615506153703,
        estimatedArrivalTime: 1615506153703,
        recipients: [
          {
            id: '7LecFRKJw7ExfyhBsi9h0NXW',
            timeCreated: 1592005264000,
            timeLastModified: 1615502820526,
            name: 'Brodie Lee',
            phone: '+17145555678',
            notes: 'Notes do not change *edited* more new notes',
            organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
            skipSMSNotifications: false,
            metadata: [],
          },
        ],
        destination: {
          id: '3NACfr4SVlCi8s~vPgKskAip',
          timeCreated: 1615502820000,
          timeLastModified: 1615502820514,
          location: [-117.895446, 33.9131177],
          address: {
            apartment: '',
            state: 'California',
            postalCode: '92821',
            number: '338',
            street: 'South Redwood Avenue',
            city: 'Brea',
            country: 'United States',
          },
          notes: '',
          metadata: [],
        },
      },
    },
    actionContext: null,
    time: 1615505708224,
  },
});
