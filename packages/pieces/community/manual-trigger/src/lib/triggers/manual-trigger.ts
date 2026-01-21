
import { createTrigger, Property, TriggerStrategy  } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';

export const manualTrigger = createTrigger({
name: 'manual_trigger',
displayName: 'Manual Trigger',
description: 'Manually start your own flow without any extra configurations',
props: {
    markdown: Property.MarkDown({
        value: `Manual triggers are used to start a flow on demand, publish your flow and click (Run Flow) at the start of the flow.`,
        variant: MarkdownVariant.INFO,
    }),
},
sampleData: {},
type: TriggerStrategy.MANUAL,
async test() {
    return [{}];
},
async onEnable() {
    return void 0;
},
async onDisable() {
    return void 0;
},
async run() {
    return [{}]
},
});