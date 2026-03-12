import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const marzipaManualTrigger = createTrigger({
    name: 'manual_trigger',
    displayName: 'Manual Trigger',
    description: 'Dispara o fluxo manualmente',
    props: {},
    sampleData: {},
    type: TriggerStrategy.MANUAL,
    async test() {
        return [{}]
    },
    async onEnable() {
        return void 0
    },
    async onDisable() {
        return void 0
    },
    async run() {
        return [{}]
    },
})
