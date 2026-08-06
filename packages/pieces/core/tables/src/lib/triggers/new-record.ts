import { createTrigger, PieceAuth, TriggerStrategy } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { PopulatedRecord, TableWebhookEventType } from '@activepieces/pieces-framework';
import { newRecordTriggerOutputSchema } from '../output-schemas';

export const newRecordTrigger = createTrigger({
    name: 'newRecord',
    displayName: 'New Record Created',
    description: 'Triggers when a new record is added to the selected table.',
    aiMetadata: {
        description: 'Fires when a new row is inserted into the selected Activepieces Table, whether the insert came from a flow, the table UI, or the API, and represents that newly created record. Use it to react to freshly captured data; edits and removals of existing rows raise the separate Record Updated and Record Deleted triggers instead. Backed by a webhook registered on one specific table, so a table must be selected.',
    },
    auth: PieceAuth.None(),
    props: {
        table_id: tablesCommon.table_id,
    },
    sampleData: {},
    outputSchema: newRecordTriggerOutputSchema,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const tableExternalId = context.propsValue.table_id;
        if ((tableExternalId ?? '').toString().length === 0) {
            return;
        }
        const tableId = await tablesCommon.convertTableExternalIdToId(tableExternalId, context);

        const { id: webhookId } = await tablesCommon.createWebhook({
            tableId,
            events: [TableWebhookEventType.RECORD_CREATED],
            webhookUrl: context.webhookUrl,
            flowId: context.flows.current.id,
            server: {
                apiUrl: context.server.apiUrl,
                token: context.server.token,
            },
            });

        context.store.put('webhookId', webhookId);
    },
    async onDisable(context){
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
    async run(context){
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