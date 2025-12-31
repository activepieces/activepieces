
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
export const receiveDeposit = createTrigger({
    name: 'receiveDeposit',
    displayName: 'Receive Deposit',
    description: 'Triggered when deposit is received',
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
        console.log('receive deposit trigger', context);
        return [context.payload.body]
    }
})