import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { WebhookInformation, facebookLeadsCommon } from "../common";

export const newLead = createTrigger({
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Triggers when a new lead is created',
    type: TriggerStrategy.WEBHOOK,
    sampleData: {},
    props: {
        authentication: facebookLeadsCommon.authentication,
        formId: facebookLeadsCommon.form
    },

    async onEnable(context) {
        // await jotformCommon.subscribeWebhook(
        //     context.propsValue['formId'],
        //     context.webhookUrl,
        //     context.propsValue['authentication']
        // );

        // await context.store?.put<WebhookInformation>('_new_facebook_lead_trigger', {
        //     leadId: context.webhookUrl,
        // });
        return
    },

    async onDisable(context) {
        // const response = await context.store?.get<WebhookInformation>(
        //     '_new_facebook_lead_trigger'
        // );

        // if (response !== null && response !== undefined) {
        //     // await jotformCommon.unsubscribeWebhook(
        //     //     context.propsValue['formId'],
        //     //     response.jotformWebhook,
        //     //     context.propsValue['authentication']
        //     // );
        // }
        return
    },

    //Return new lead
    async run(context) {
        return [context.payload.body];
    }
})