import { createTrigger, PieceAuth, TriggerStrategy } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { PopulatedRecord, TableWebhookEventType } from '@activepieces/pieces-framework';
import { deletedRecordTriggerOutputSchema } from '../output-schemas';

export const deletedRecordTrigger = createTrigger({
    name: 'deletedRecord',
    displayName: 'Record Deleted',
    description: 'Triggers when a record is deleted from the selected table.',
    aiMetadata: {
        description: 'Fires when a row is removed from the selected Activepieces Table, whether the deletion came from a flow, the table UI, or the API, and represents the record as it stood at the moment of deletion. Use it to react to removals or to archive a row elsewhere, since the record can no longer be fetched afterwards; inserts and edits raise the separate New Record Created and Record Updated triggers. Backed by a webhook registered on one specific table, so a table must be selected.',
    },
    auth: PieceAuth.None(),
    props: {
        table_id: tablesCommon.table_id,
    },
    sampleData: {},
    outputSchema: deletedRecordTriggerOutputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const tableExternalId = context.propsValue.table_id;
        if ((tableExternalId ?? '').toString().length === 0) {
            return;
        }
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

        const { id: webhookId } = await tablesCommon.createWebhook({
            tableId,
            events: [TableWebhookEventType.RECORD_DELETED],
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
