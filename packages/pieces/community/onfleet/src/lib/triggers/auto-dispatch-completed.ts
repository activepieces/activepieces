import {
  TriggerStrategy,
  WebhookHandshakeStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { common, OnfleetWebhookTriggers } from '../common';
import { onfleetAuth } from '../..';

export const autoDispatchCompleted = createTrigger({
  auth: onfleetAuth,
  name: 'auto_dispatch_completed',
  displayName: 'Auto Dispatch Completed',
  description: 'Triggers when team auto-dispatch calculation is completed',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  //Create the webhook and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await common.subscribeWebhook(
      context.auth,
      context.webhookUrl,
      OnfleetWebhookTriggers.AUTO_DISPATCH_COMPLETED
    );

    await context.store?.put('_auto_dispatch_completed_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook
  async onDisable(context) {
    const response: any = await context.store?.get(
      '_auto_dispatch_completed_trigger'
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
    actionContext: {
      apiKeyScopeId: '34522acbaf4558bee7474e594aa2ba0c',
      id: 'vjw*RDMKDljKVDve1Vtcplgu',
      type: 'API',
    },
    adminId: null,
    data: {
      dispatch: {
        id: 'XaSPx65XPOTiyzu7hbjlgTxN',
        options: {
          maxAllowedDelay: 10,
          maxTasksPerRoute: 50,
          routeEnd: 'teams://DEFAULT',
          scheduleTimeWindow: [1659727323264, 1659748923264],
          serviceTime: 4,
          taskTimeWindow: [1659712923264, 1659741723264],
        },
        organization: 'nYrkNP6jZMSKgBwG9qG7ci3J',
        plan: {
          routes: [
            {
              routeId: 'ZxcnkJi~79nonYaMTQ960Mg2',
              stops: [
                {
                  arrivalTime: 1659729556337,
                  departTime: 1659729796337,
                  id: 'LdvrBX7fADEvlNuFUZJu8d9S',
                  type: 'TASK',
                },
                {
                  arrivalTime: 1659733290968,
                  departTime: 1659733530968,
                  id: '~JA*OXe7f6sLzy~zo6brH6xp',
                  type: 'TASK',
                },
                {
                  arrivalTime: 1659737162319,
                  departTime: 1659737402319,
                  id: 'bn50Lcsu8rqETDWJTIdecufy',
                  type: 'TASK',
                },
                {
                  arrivalTime: 1659738493969,
                  departTime: 1659738733969,
                  id: 'Sef4w3TakeQk6dQJBhQDYglsO',
                  type: 'TASK',
                },
              ],
              type: 'WORKER',
            },
          ],
          unplanned: [],
        },
        processingDetails: {
          endTime: 1659727327650,
          startTime: 1659727323428,
          status: 'success',
        },
        tasks: [
          {
            additionalQuantities: {
              quantityA: 0,
              quantityB: 0,
              quantityC: 0,
            },
            completeAfter: null,
            completeBefore: null,
            id: 'Sef4w3TakeQk6dQJBhQDYglsO',
            pickupTask: false,
            quantity: 0,
            shortId: '2770e3e3',
          },
          {
            additionalQuantities: {
              quantityA: 0,
              quantityB: 0,
              quantityC: 0,
            },
            completeAfter: 1659726000000,
            completeBefore: 1659751200000,
            id: 'LdvrBX7fADEvlNuFUZJu8d9S',
            pickupTask: false,
            quantity: 0,
            shortId: 'ce6439b7',
          },
          {
            additionalQuantities: {
              quantityA: 0,
              quantityB: 0,
              quantityC: 0,
            },
            completeAfter: 1659726000000,
            completeBefore: 1659747600000,
            id: 'bn50Lcsu8rqETDWJTIdecufy',
            pickupTask: false,
            quantity: 0,
            shortId: '6d87d2bf',
          },
          {
            additionalQuantities: {
              quantityA: 0,
              quantityB: 0,
              quantityC: 0,
            },
            completeAfter: 1659726000000,
            completeBefore: 1659754800000,
            id: '~JA*OXe7f6sLzy~zo6brH6xp',
            pickupTask: false,
            quantity: 0,
            shortId: '2e2f201c',
          },
        ],
        team: 'K3FXFtJj2FtaO2~H60evRrDc',
      },
    },
    dispatchId: 'XaSPx65XPOTiyzu7hbjlgTxN',
    taskId: null,
    time: 1659727327697,
    triggerId: 18,
    triggerName: 'autoDispatchJobCompleted',
    workerId: null,
  },
});
