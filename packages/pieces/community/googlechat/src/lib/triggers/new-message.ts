
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { googleChatApiAuth, pubSubClient } from '../constants';

const MODULE_NAME = `New Message`
const SUBSCRIPTION_NAME = `ACP ${MODULE_NAME} ${Date.now()}`;

export const newMessage = createTrigger({
    auth: googleChatApiAuth,
    name: 'newMessage',
    displayName: 'New Message',
    description: 'Fires when a new message is received in Google Chat.',
    props: {},
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context){
        const options = {
          pushConfig: {
            pushEndpoint: context.webhookUrl
          },
        };

        await pubSubClient
          .topic('acp')
          .createSubscription(
            SUBSCRIPTION_NAME,
            options
          );
        
        console.log(`Subscription created.`);
    },
    async onDisable(context){
         await pubSubClient
          .subscription(SUBSCRIPTION_NAME)
          .delete();
    },
    async run(context){
        return [context.payload.body]
    }
})