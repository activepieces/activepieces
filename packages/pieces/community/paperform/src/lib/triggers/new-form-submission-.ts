import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

export const newFormSubmission	 = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'new_form_submission',
    displayName: 'New Form Submission',
    description: 'Fires when a completed form submission is received.',
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
