import { PieceAuth, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'
import { PopulatedRecord, TableWebhookEventType } from '@activepieces/shared'
import { tablesCommon } from '../common'

export const updatedRecordTrigger = createTrigger({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updatedRecord',
  displayName: 'Record Updated',
  description: 'Triggers when a record is updated in the selected table.',
  auth: PieceAuth.None(),
  props: {
    table_id: tablesCommon.table_id,
  },
  sampleData: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const tableId = context.propsValue.table_id
    if ((tableId ?? '').toString().length === 0) {
      return
    }

    const { id: webhookId } = await tablesCommon.createWebhook({
      tableId,
      events: [TableWebhookEventType.RECORD_UPDATED],
      webhookUrl: context.webhookUrl,
      flowId: context.flows.current.id,
      server: {
        apiUrl: context.server.apiUrl,
        token: context.server.token,
      },
    })

    context.store.put('webhookId', webhookId)
  },
  async onDisable(context) {
    const tableId = context.propsValue.table_id
    if ((tableId ?? '').toString().length === 0) {
      return
    }

    const webhookId = await context.store.get<string>('webhookId')
    if (!webhookId) {
      return
    }

    await tablesCommon.deleteWebhook({
      tableId,
      webhookId: webhookId,
      server: {
        apiUrl: context.server.apiUrl,
        token: context.server.token,
      },
    })
  },
  async run(context) {
    return [tablesCommon.formatRecord(context.payload.body as PopulatedRecord)]
  },
  async test(context) {
    return tablesCommon.getRecentRecords({
      tableId: context.propsValue.table_id,
      context,
    })
  },
})
