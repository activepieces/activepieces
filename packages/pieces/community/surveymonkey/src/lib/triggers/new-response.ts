import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { smCommon } from '../common';
import { smAuth } from '../..';

export const newResponse = createTrigger({
  auth: smAuth,
  name: 'new_response',
  displayName: 'New Response',
  description: 'Triggers when a new response is submitted',
  type: TriggerStrategy.WEBHOOK,
  sampleData: {},
  props: {
    survey: smCommon.survey,
  },
  //Create the webhook in SurveyMonkey and save the webhook ID in store for disable behavior
  async onEnable(context) {
    const webhookId = await smCommon.subscribeWebhook(
      context.propsValue.survey as number,
      context.webhookUrl,
      context.auth['access_token']
    );

    await context.store?.put('_new_response_trigger', {
      webhookId: webhookId,
    });
  },
  //Delete the webhook from SurveyMonkey
  async onDisable(context) {
    const response: any = await context.store?.get('_new_response_trigger');

    if (response !== null && response !== undefined) {
      await smCommon.unsubscribeWebhook(
        response.webhookId,
        context.auth['access_token']
      );
    }
  },
  //Return new response
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;
    const responseData = await smCommon.getResponseDetails(
      context.auth['access_token'],
      context.propsValue['survey'] as number,
      payloadBody.object_id
    );

    return [responseData];
  },
});

type PayloadBody = {
  object_id: string | number;
};
