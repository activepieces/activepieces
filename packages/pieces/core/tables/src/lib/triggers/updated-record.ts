import { createTrigger, PieceAuth, TriggerStrategy } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { PopulatedRecord, TableWebhookEventType } from '@activepieces/pieces-framework';

export const updatedRecordTrigger = createTrigger({
    name: 'updatedRecord',
    displayName: 'Record Updated',
    description: 'Triggers when a record is updated in the selected table.',
    aiMetadata: {
        description: 'Fires when cell values on a row that already exists in the selected Activepieces Table are changed, whether the edit came from a flow, the table UI, or the API, and represents that record in its post-update state. Use it to react to edits of stored data; inserts and removals raise the separate New Record Created and Record Deleted triggers instead. Backed by a webhook registered on one specific table, so a table must be selected.',
    },
    auth: PieceAuth.None(),
    props: {
        table_id: tablesCommon.table_id,
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const tableExternalId = context.propsValue.table_id;
        if ((tableExternalId ?? '').toString().length === 0) {
            return;
        }
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

        const { id: webhookId } = await tablesCommon.createWebhook({
            tableId,
            events: [TableWebhookEventType.RECORD_UPDATED],
            webhookUrl: context.webhookUrl,
            flowId: context.flows.current.id,
            server: {
                apiUrl: context.server.apiUrl,
                token: context.server.token,
            },
        });

        context.store.put('webhookId', webhookId);
    },
    async onDisable(context) {
        const tableExternalId = context.propsValue.table_id;
        if ((tableExternalId ?? '').toString().length === 0) {
            return;
        }
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

        const webhookId = await context.store.get<string>('webhookId');
        if (!webhookId) {
            return;
        }

        await tablesCommon.deleteWebhook({
            tableId,
            webhookId: webhookId,
            server: {
                apiUrl: context.server.apiUrl,
                token: context.server.token,
            },
        });
    },
    async run(context) {
        return [tablesCommon.formatRecord(context.payload.body as PopulatedRecord)]
    },
    async test(context) {
        const tableId = await tablesCommon.convertTableExternalIdToId(context.propsValue.table_id, context);
        return tablesCommon.getRecentRecords({
            tableId,
            context
        });
    }
})