import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';
import { mondayAuth } from '../..';
import { makeClient, mondayCommon } from '../common';
import {
  MondayNotWritableColumnType,
  MondayWebhookEventType,
} from '../common/constants';
import { WebhookInformation } from '../common/models';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
export const specificColumnValueUpdatedTrigger = createTrigger({
  auth: mondayAuth,
  name: 'monday_specific_column_updated',
  displayName: 'Specific Column Value Updated in Board',
  description: 'Triggers when a specific column value is updated in board.',
  props: {
    workspace_id: mondayCommon.workspace_id(true),
    board_id: mondayCommon.board_id(true),
    column_id: Property.Dropdown({
      displayName: 'Column ID',
      required: true,
      refreshers: ['board_id'],
      options: async ({ auth, board_id }) => {
        if (!auth || !board_id) {
          return {
            disabled: true,
            placeholder:
              'connect your account first and select workspace board.',
            options: [],
          };
        }
        const client = makeClient(auth as string);
        const res = await client.listBoardColumns({
          boardId: board_id as string,
        });
        return {
          disabled: false,
          options: res.data.boards[0].columns
            .filter(
              (column) => !MondayNotWritableColumnType.includes(column.type)
            )
            .map((column) => {
              return {
                label: column.title,
                value: column.id,
              };
            }),
        };
      },
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: {
      app: 'monday',
      type: 'update_column_value',
      triggerTime: '2024-01-08T04:41:55.245Z',
      subscriptionId: 3209024,
      userId: 53812737,
      originalTriggerUuid: null,
      boardId: 1835745535,
      groupId: 'topics',
      pulseId: 1835700420,
      pulseName: 'Sample Item',
      columnId: 'country',
      columnType: 'country',
      columnTitle: 'Country',
      value: {
        countryCode: 'AW',
        countryName: 'Aruba',
        changed_at: '2024-01-08T04:42:00.109Z',
      },
      previousValue: {
        changed_at: '2024-01-08T04:41:39.461Z',
        countryCode: 'IO',
        countryName: 'British Indian Ocean Territory',
      },
      changedAt: 1704688953.239433,
      isTopGroup: true,
      triggerUuid: '72a1ec82ea678e03b55b050711b71e9d',
    },
  },
  async onEnable(context) {
    const { board_id, column_id } = context.propsValue;

    const client = makeClient(context.auth as string);
    const res = await client.createWebhook({
      boardId: board_id,
      url: context.webhookUrl,
      event: MondayWebhookEventType.CHANGE_SPECIFIC_COLUMN_VALUE,
      config: JSON.stringify({ columnId: column_id }),
    });
    await context.store.put<WebhookInformation>(
      'monday_specific_column_updated',
      res.data
    );
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'monday_specific_column_updated'
    );
    if (webhook != null) {
      const client = makeClient(context.auth as string);
      await client.deleteWebhook({ webhookId: webhook.id });
    }
  },
  async run(context) {
    return [context.payload.body];
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
