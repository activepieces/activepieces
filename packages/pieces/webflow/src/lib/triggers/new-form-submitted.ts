import { webflowCommon, sitesDropdown } from '../common/common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from "@activepieces/pieces-common";

const triggerNameInStore = 'webflow_created_form_submissions_trigger';

export const webflowNewSubmission = createTrigger({
    name: 'new_submission',
    displayName: 'New Submission',
    description: 'Triggers when Webflow Site receives a new submission',
    props: {
        authentication: webflowCommon.authentication,
        _id: sitesDropdown,
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
      "name": "Sample Form",
      "site": "62749158efef318abc8d5a0f",
      "data": {
          "name": "Some One",
          "email": "some.one@home.com"
      },
      "d": "2022-09-14T12:35:16.117Z",
      "_id": "6321ca84df3949bfc6752327"
    },
    async onEnable(context) {
        const formSubmissionTag ="form_submission";
        
       const res = await webflowCommon.subscribeWebhook(
            context.propsValue['_id']!,
            formSubmissionTag,
            context.webhookUrl,
            getAccessTokenOrThrow(context.propsValue['authentication'])
        );
        await context.store?.put<WebhookInformation>(triggerNameInStore, {
          webhookId: res.body._id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(triggerNameInStore);
        if (response !== null && response !== undefined) {
            await webflowCommon.unsubscribeWebhook(
                context.propsValue['_id']!,
                response.webhookId,
                getAccessTokenOrThrow(context.propsValue['authentication'])
            );
        }
    },
    async run(context) {
        const body = context.payload.body as { _id: unknown };
        return [body._id];
    },
});

interface WebhookInformation {
  webhookId: string;
}
