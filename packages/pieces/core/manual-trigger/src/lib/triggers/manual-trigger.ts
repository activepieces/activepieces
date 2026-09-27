
import { createTrigger, Property, TriggerStrategy  } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/pieces-framework';

export const manualTrigger = createTrigger({
name: 'manual_trigger',
classification: 'READ',
displayName: 'Manual Trigger',
description: 'Start the flow on demand with the Run Flow button',
aiMetadata: {
  description: 'Fires when a published flow is started manually on demand, for example a user clicking Run Flow, rather than in response to an external event; the event itself carries no payload. Use it as the entry point for flows an operator or agent invokes directly, and prefer a webhook trigger for external app events, a schedule trigger for time-based runs, or the Web Form, Chat UI, or Callable Flow triggers when the invoker must supply input.',
},
props: {
    markdown: Property.MarkDown({
        value: `Publish the flow, then click **Run Flow** on the canvas to start it.

This trigger passes no data, so later steps have nothing to map from it.`,
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