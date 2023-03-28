import { createTrigger } from '@activepieces/framework';
import { TriggerStrategy } from '@activepieces/shared';

export const jotformNewSubmissionTrigger = 
  createTrigger({
    name: "jotform_new_submission_trigger",
    displayName: "New Submission",
    description: "Receive notification on every new submission.",
    props: {
    },
    type: TriggerStrategy.APP_WEBHOOK,
    sampleData: {
      
    },
    onEnable: async (context) => {
      context.app.createListeners({
        events: [], 
        identifierValue: context.propsValue.authentication.data['merchant_id'] 
      })
    },
    onDisable: async (context) => {
      // Ignored
    },
    run: async (context) => {
      return [context.payload.body]
    }
  });
