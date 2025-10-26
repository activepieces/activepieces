
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import * as errorHandlerCommon from '../common';
import { FlowRun } from '@activepieces/shared';

export const flowRunFailed = createTrigger({
    name: 'flowRunFailed',
    displayName: 'flow run failed',
    description: 'triggers when A flow run has failed',
    props: {
        flow_ids: errorHandlerCommon.flowIdsDropdown,
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const triggerFlowIds = context.propsValue.flow_ids;
        const targetFlowId = context.flows.current.id;
        const webhook = await errorHandlerCommon.createWebhooks(context, targetFlowId, triggerFlowIds)
        context.store.put('webhookId', webhook.id);
    },
    async onDisable(context){
        const webhookId = await context.store.get('webhookId');
        if(webhookId){
            await errorHandlerCommon.deleteWebhook(context, webhookId as string)
        }
    },
    async run(context){
        return [context.payload.body as FlowRun]
    },
    async test(context){
        return [{flowRun: {}}]
    }
})