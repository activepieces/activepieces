import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { youformAuth } from '../auth';
import { youformProps } from '../common/props';
import { youformApi } from '../common/api';
import { isNil } from '@activepieces/pieces-framework';
import { newSubmissionOutputSchema } from '../output-schemas';

const TRIGGER_KEY = 'youform-new-submission-trigger';

export const newSubmissionTrigger = createTrigger({
  name: 'new-submission',
  outputSchema: newSubmissionOutputSchema,
  classification: 'READ',
  auth: youformAuth,
  displayName: 'New Submission',
  description: 'Triggers When a new submission is recieved.',
  aiMetadata: {
    description:
      'Fires when a respondent submits the selected Youform form. The event represents a single completed form submission and emits its full payload, including the submitted answers and submission metadata.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    formId: youformProps.formId({ required: true }),
  },
  async onEnable(context) {
    const { formId } = context.propsValue;

    const response = await youformApi.createWebhook({
      auth: context.auth,
      formId: formId.toString(),
      webhookUrl: context.webhookUrl,
    });

    const webhookId = response.data.id;

    await context.store.put<number>(TRIGGER_KEY, webhookId);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<number>(TRIGGER_KEY);

    if (!isNil(webhookId)) {
      await youformApi.deleteWebhook({
        auth: context.auth,
        webhookId,
      });
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  async test(context) {
    return [context.payload.body];
  },
  sampleData: undefined,
});
