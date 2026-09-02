import { pollingHelper } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { formioAuth } from '../auth';
import { submissionTriggerOutputSchema } from '../common/output-schemas';
import { formioProps } from '../common/props';
import { SAMPLE_SUBMISSION } from './register-submission-trigger';
import { submissionPolling, SubmissionTimestamp } from './submission-polling';

export function registerPollingSubmissionTrigger({
  name,
  displayName,
  description,
  aiDescription,
  timestampField,
}: {
  name: string;
  displayName: string;
  description: string;
  aiDescription: string;
  timestampField: SubmissionTimestamp;
}) {
  const polling = submissionPolling(timestampField);

  return createTrigger({
    auth: formioAuth,
    name,
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: { formPath: formioProps.formPath },
    type: TriggerStrategy.POLLING,
    outputSchema: submissionTriggerOutputSchema,
    sampleData: SAMPLE_SUBMISSION,

    async onEnable(context) {
      await pollingHelper.onEnable(polling, {
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
      });
    },

    async onDisable(context) {
      await pollingHelper.onDisable(polling, {
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
      });
    },

    async run(context) {
      return await pollingHelper.poll(polling, {
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
        files: context.files,
      });
    },

    async test(context) {
      return await pollingHelper.test(polling, {
        auth: context.auth,
        propsValue: context.propsValue,
        store: context.store,
        files: context.files,
      });
    },
  });
}
