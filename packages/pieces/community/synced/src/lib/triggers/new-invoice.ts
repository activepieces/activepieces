
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { syncedAuth } from '../..';
import { syncedCommon } from '../common';

export const newInvoice = createTrigger({
    // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
    name: 'newInvoice',
    displayName: 'New Invoice',
    description: 'Trigger fire when new invoice Upload',
    props: {
      organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Organization ID',
      required: true,
    })
    },
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    auth: syncedAuth,
    async onEnable(context) {
        const webhook = await syncedCommon.subscribeWebhook(
          context.webhookUrl!,
          context.propsValue.organization_id,
          context.auth,
          'New Invoice',
        );
        console.log(webhook.message ,"APi Call WebHookID")
        const data:any=webhook.message;
        console.log(data.message ,"APi Call WebHookID 2 ")

        //  console.log(webhook.data.message.split('|')[1],"APi Call WebHookID")
        const webhookId=webhook.message.split('|')[1];
        console.log(webhookId,"APi Call WebHookID")
        await context.store?.put<WebhookInformation>('_new_invoice_trigger', {
          webhookId: webhookId,
        });
        console.log(context.store,"Store")
      },
      async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(
          '_new_invoice_trigger'
        );
        if (response !== null && response !== undefined) {
          await syncedCommon.unsubscribeWebhook(context.propsValue.organization_id,response.webhookId, context.auth);
        }
      },
      async run(context) {

        const payloadBody = context.payload.body as PayloadBody;
        return [payloadBody.data.object];
      },
})

type PayloadBody = {
    data: {
      object: unknown;
    };
  };
  
  interface WebhookInformation {
    webhookId: string;
  }