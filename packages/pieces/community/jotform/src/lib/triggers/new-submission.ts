import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { WebhookInformation, jotformCommon } from '../common';
import { jotformAuth } from '../..';

export const newSubmission = createTrigger({
  auth: jotformAuth,
  name: 'new_submission',
  displayName: 'New Submission',
  description: 'Triggers when a new submission is submitted',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},
  props: {
    formId: jotformCommon.form,
  },
  //Set the webhook URL in Jotform and save the webhook URL in store for disable behavior
  async onEnable(context) {
    await jotformCommon.subscribeWebhook(
      context.propsValue['formId'],
      context.webhookUrl,
      context.auth
    );

    await context.store?.put<WebhookInformation>(
      '_new_jotform_submission_trigger',
      {
        jotformWebhook: context.webhookUrl,
      }
    );
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
        context.auth
      );
    }
  },
  //Return new submission
  async run(context) {
    return [context.payload.body];
  },
});
