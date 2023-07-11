import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';


const markdown = `
Go to plugins and activate the webhook plugin.
Then go to the form you want to trigger on and add a webhook to it.
The webhook url should be {{webhookUrl}}.
You can leave the other settings as default.
`

export const gravityFormsNewSubmission = createTrigger({
    name: 'gravityforms-new-submission',
    displayName: 'New Submission',
    description: 'Triggers when form receives a new submission',
    props: {
        md: Property.MarkDown({
            description: markdown,
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