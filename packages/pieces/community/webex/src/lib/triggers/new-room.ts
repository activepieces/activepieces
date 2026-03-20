import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { webexAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newRoom = createTrigger({
  auth: webexAuth,
  name: 'newRoom',
  displayName: 'New room',
  description: 'Triggers when a new room is created',
  props: {},
  sampleData: {
    id: 'Y2lzY29zcGFyazovL3VybjpURUFNOnVzLWVhc3QtMS9XRUJIT09LLzEyMzQ1Njc4LWFiYzEtNGRlZi1hYmNkLWU5ODc2NTQzMjEwMQ',
    name: 'Dummy Room Trigger Webhook',
    targetUrl: 'https://example-webhook-url.com/api/v1/webhooks/abcd1234',
    resource: 'rooms',
    event: 'created',
    orgId:
      'Y2lzY29zcGFyazovL3VzL09SR0FOSVpBVElPTi84NzY1NDMyLTEyMzQtNDU2Ny1hYmNkLTU0MzIxMGV5ZXk4Nw',
    createdBy:
      'Y2lzY29zcGFyazovL3VzL1BFT1BMRS8xMjM0NTY3OC05YWJjLTRkZWYtOTg3Ni1lNTQzMjEwYWJjZGU',
    appId:
      'Y2lzY29zcGFyazovL3VzL0FQUExJQ0FUSU9OLzEyMzQ1Njc4LTkwYWItNGRlZi05ODc2LWU1NDMyMTBhYmNkZQ',
    ownedBy: 'creator',
    status: 'active',
    created: '2025-11-13T10:00:00.000Z',
    actorId:
      'Y2lzY29zcGFyazovL3VzL1BFT1BMRS8xMjM0NTY3OC05YWJjLTRkZWYtOTg3Ni1lNTQzMjEwYWJjZGU',
    data: {
      id: 'Y2lzY29zcGFyazovL3VybjpURUFNOnVzLWVhc3QtMS9ST09NLzEyMzQ1Njc4LTkwYWItNGRlZi05ODc2LWU1NDMyMTBhYmNkZQ',
      type: 'group',
      isLocked: false,
      lastActivity: '2025-11-13T10:01:00.000Z',
      titleEncryptionKeyUrl:
        'kms://kms-example.com/keys/12345678-abcd-efgh-ijkl-9876543210mn',
      creatorId:
        'Y2lzY29zcGFyazovL3VzL1BFT1BMRS8xMjM0NTY3OC05YWJjLTRkZWYtOTg3Ni1lNTQzMjEwYWJjZGU',
      created: '2025-11-13T10:01:00.000Z',
      isAnnouncementOnly: false,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      `/webhooks`,
      {
        event: 'created',
        resource: 'rooms',
        targetUrl: context.webhookUrl,
        name: 'New Room Trigger Webhook',
      }
    );

    await context.store.put<WebhookInformation>('webex_new_room_trigger_id', {
      id: response.id,
    });
  },
  async onDisable(context) {
    const response = await context.store?.get<WebhookInformation>(
      'webex_new_room_trigger_id'
    );
    if (response !== null && response !== undefined) {
      await makeRequest(
        context.auth.access_token,
        HttpMethod.DELETE,
        `/webhooks/${response.id}`
      );
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});

interface WebhookInformation {
  id: string;
}
