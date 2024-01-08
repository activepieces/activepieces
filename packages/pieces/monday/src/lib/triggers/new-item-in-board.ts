import {
  TriggerStrategy,
  WebhookHandshakeStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import { MondayWebhookEventType } from '../common/constants';
import { parseMondayColumnValue } from '../common/helper';
import { WebhookInformation } from '../common/models';

export const newItemInBoardTrigger = createTrigger({
  auth: mondayAuth,
  name: 'monday_new_item_in_board',
  displayName: 'New Item in Board',
  description: 'Triggers when a new item is created in board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: {
      userId: 9603417,
      originalTriggerUuid: null,
      boardId: 1771812698,
      pulseId: 1772099344,
      pulseName: 'Create_item webhook',
      groupId: 'topics',
      groupName: 'Group Title',
      groupColor: '#579bfc',
      isTopGroup: true,
      columnValues: {},
      app: 'monday',
      type: 'create_pulse',
      triggerTime: '2021-10-11T09:07:28.210Z',
      subscriptionId: 73759690,
      triggerUuid: 'b5ed2e17c530f43668de130142445cba',
    },
  },
  async onEnable(context) {
    const { board_id } = context.propsValue;

    const client = makeClient(context.auth as string);
    const res = await client.createWebhook({
      boardId: board_id,
      url: context.webhookUrl,
      event: MondayWebhookEventType.CREATE_ITEM,
    });
    await context.store.put<WebhookInformation>(
      'monday_new_item_trigger',
      res.data
    );
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'monday_new_item_trigger'
    );
    if (webhook != null) {
      const client = makeClient(context.auth as string);
      await client.deleteWebhook({ webhookId: webhook.id });
    }
  },
  async run(context) {
    const payload = context.payload.body as MondayWebhookPayload;
    const transformedValues: Record<string, any> = {};
    try {
      const client = makeClient(context.auth as string);
      const res = await client.getItemColumnValues({
        boardId: payload.event.boardId,
        itemId: payload.event.pulseId,
      });
      const item = res.data.boards[0].items_page.items[0];
      for (const column of item.column_values) {
        transformedValues[column.id] = parseMondayColumnValue(column);
      }
    } catch (e) {
      console.error(e);
    }

    const enriched = [
      {
        ...payload,
        columnValues: transformedValues,
      },
    ];
    return enriched;
  },
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.BODY_PARAM_PRESENT,
    paramName: 'challenge',
  },
  async onHandshake(context) {
    return {
      status: 200,
      body: { challenge: (context.payload.body as any)['challenge'] },
    };
  },
});

interface MondayWebhookPayload {
  event: {
    userId: number;
    originalTriggerUuid: null;
    boardId: number;
    pulseId: number;
    pulseName: string;
    groupId: string;
    groupName: string;
    groupColor: string;
    isTopGroup: boolean;
    columnValues: Record<string, unknown>;
    app: string;
    type: 'create_pulse';
    triggerTime: string;
    subscriptionId: number;
    triggerUuid: string;
  };
}
