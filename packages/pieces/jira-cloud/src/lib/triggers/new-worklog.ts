import { TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
// import { common, OnfleetWebhookTriggers } from "../common";
import { jiraCloudAuth } from "../..";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const newWorklog = createTrigger({
    auth: jiraCloudAuth,
    name: 'new_worklog',
    displayName: 'New Issue Worklog',
    description: 'Triggers when a worklog is created for an issue',
    type: TriggerStrategy.WEBHOOK,
    props: {},
    async onEnable(context) {
        const response = await httpClient.sendRequest({
            url: ``,
            method: HttpMethod.POST,
            body: {

            }
        });

        await context.store?.put('_new_worklog_trigger', {
            webhookId: response.body,
        });
    },
    async onDisable(context) {
        const response: any = await context.store?.get(
            '_new_worklog_trigger'
        );

        if (response !== null && response !== undefined) {
            // await common.unsubscribeWebhook(context.auth, response.webhookId);
        }
    },
    async run(context) {
        return [context.payload.body];
    },

    sampleData: {}
})