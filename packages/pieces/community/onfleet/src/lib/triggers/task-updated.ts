import {
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const taskUpdated = createTrigger({
  auth: onfleetAuth,
  name: 'task_updated',
  displayName: 'Task Updated',
  description: 'Triggers when a task is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.TASK_UPDATED
    );

    await context.store?.put('_task_updated_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get('_task_updated_trigger');

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
    taskId: 'w7CcGpzsMnEiUg1AqgxQbPE~',
    workerId: 'ZxcnkJi~79nonYaMTQ960Mg2',
    actionContext: {
      type: 'ADMIN',
      id: 'vjw*RDMKDljKVDve1Vtcplgu',
    },
    triggerId: 7,
    triggerName: 'taskUpdated',
    adminId: 'vjw*RDMKDljKVDve1Vtcplgu',
    data: {
      task: {
        id: 'w7CcGpzsMnEiUg1AqgxQbPE~',
        timeCreated: 1627329316000,
        timeLastModified: 1627329522544,
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        shortId: 'c9ed4d00',
        trackingURL: 'https://onf.lt/c9ed4d00',
        worker: 'ZxcnkJi~79nonYaMTQ960Mg2',
        merchant: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        executor: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        creator: 'vjw*RDMKDljKVDve1Vtcplgu',
        dependencies: [],
        state: 1,
        completeAfter: null,
        completeBefore: null,
        pickupTask: false,
        notes: 'This is updated Notes',
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
          worker: 'ZxcnkJi~79nonYaMTQ960Mg2',
        },
        trackingViewed: false,
        recipients: [],
        estimatedCompletionTime: 1627330894582,
        estimatedArrivalTime: 1627330592582,
        destination: {
          id: '7i9PoiinkxWtWbytv1HLY9SS',
          timeCreated: 1627329316000,
          timeLastModified: 1627329522522,
          location: [-117.8764687, 33.8078476],
          address: {
            apartment: '',
            state: 'California',
            postalCode: '92806',
            number: '2695',
            street: 'East Katella Avenue',
            city: 'Anaheim',
            country: 'United States',
            name: 'Honda Center',
          },
          notes: '',
          metadata: [],
          googlePlaceId: null,
          warnings: [],
        },
        delayTime: null,
      },
      worker: {
        id: 'ZxcnkJi~79nonYaMTQ960Mg2',
        timeCreated: 1618618787000,
        timeLastModified: 1627329496627,
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        name: 'Red Ranger',
        displayName: '',
        phone: '+17145555768',
        activeTask: null,
        tasks: ['w7CcGpzsMnEiUg1AqgxQbPE~'],
        onDuty: true,
        timeLastSeen: 1627329498940,
        capacity: 0,
        userData: {
          appVersion: '2.1.13.2',
          batteryLevel: 0.65,
          deviceDescription: 'Google Pixel 2 (Android 11)',
          platform: 'ANDROID',
        },
        accountStatus: 'ACCEPTED',
        metadata: [],
        timezone: 'America/Los_Angeles',
        imageUrl: null,
        teams: ['K3FXFtJj2FtaO2~H60evRrDc'],
        delayTime: null,
        location: [-117.8954515, 33.9131014],
        hasRecentlyUsedSpoofedLocations: false,
        vehicle: {
          id: 'vSRLJ80Aw3DljIh1Rj9obLtn',
          type: 'CAR',
          description: '',
          licensePlate: '',
          color: '',
          timeLastModified: 1625065516261,
        },
      },
    },
    time: 1627329522593,
  },
});
