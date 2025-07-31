import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newPartialFormSubmission = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'new_partial_form_submission',
    displayName: 'New Partial Form Submission',
    description: 'Fires when a partial/in-progress submission is received.',
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
        return [context.payload.body]
    }
})
