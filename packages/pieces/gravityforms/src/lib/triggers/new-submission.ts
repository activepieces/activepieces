import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';

export const gravityFormsNewSubmission = createTrigger({
    name: 'gravityforms-new-submission',
    displayName: 'New Submission',
    description: 'Triggers when form receives a new submission',
    props: {
        md: Property.MarkDown({
            description: "{{webhookUrl}}",
            required: true,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: { },
    async onEnable(context) {
        // lol
    },
    async onDisable(context) {
        // lol
    },
    async run(context) {
        return [context];
    },
    async test(context) {
        return [context];
    }
});