import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { WebhookInformation, jotformCommon } from "../common";

export const newSubmission = createTrigger({
    name: 'new_submission',
    displayName: 'New Submission',
    description: 'Triggers when a new submission is submitted',
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},
    props: {
        authentication: jotformCommon.authentication,
        formId: jotformCommon.form
    },

    //Set the webhook URL in Jotform and save the webhook URL in store for disable behavior
    async onEnable(context) {
        await jotformCommon.subscribeWebhook(
          context.propsValue['formId'],
          context.webhookUrl,
          context.propsValue['authentication']
        );

        await context.store?.put<WebhookInformation>('_new_jotform_submission_trigger', {
          jotformWebhook: context.webhookUrl,
        });
    },

    //Delete the webhook URL from Jotform
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(
          '_new_jotform_submission_trigger'
        );

        if (response !== null && response !== undefined) {
          await jotformCommon.unsubscribeWebhook(
            context.propsValue['formId'],
            response.jotformWebhook,
            context.propsValue['authentication']
          );
        }
    },

    //Return new submission
    async run(context) {
        return [context.payload.body];
    }
})