
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { zroswissAuth } from '../../index';

export const rfqApproved = createTrigger({
    auth: zroswissAuth,
    name: 'rfqApproved',
    displayName: 'RFQ Approved',
    description: 'Triggered when the RFQ is approved.',
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        // implement webhook creation logic
    },
    async onDisable(context){
        // implement webhook deletion logic
    },
    async run(context){
        console.log('start rfq approved trigger', context);
        return [context.payload.body];
    }
})