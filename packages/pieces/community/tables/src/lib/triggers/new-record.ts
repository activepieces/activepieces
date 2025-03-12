import { createTrigger, PieceAuth, PropertyType, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { tablesCommon } from '../common';
import { PopulatedRecord, TableWebhookEventType } from '@activepieces/shared';

export const newRecordTrigger = createTrigger({
    name: 'newRecord',
    displayName: 'New Record',
    description: 'Triggers when a new record is added to the selected table.',
    auth: PieceAuth.None(),
    props: {
        table_id: tablesCommon.table_id,
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const tableId = context.propsValue.table_id;
        if ((tableId ?? '').toString().length === 0) {
            return;
        }

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
        const tableId = context.propsValue.table_id;
        if ((tableId ?? '').toString().length === 0) {
            return;
        }

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
        return tablesCommon.getRecentRecords({
            tableId: context.propsValue.table_id,
            context
        });
    }
})