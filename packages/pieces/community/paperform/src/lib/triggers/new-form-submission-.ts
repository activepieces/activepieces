import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { paperformCommonProps } from '../common/props';
import { PaperformSubmission } from '../common/types';

const TRIGGER_KEY = 'new_form_submission';

export const newFormSubmission = createTrigger({
  auth: paperformAuth,
  name: 'new_form_submission',
  displayName: 'New Form Submission',
  description: 'Triggers when a completed form submission is received.',
  props: {
    formId: paperformCommonProps.formId,
  },

  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const formId = context.propsValue.formId;
    const response = await paperformCommon.createWebhook({
      formId,
      webhookUrl: context.webhookUrl,
      auth: context.auth.secret_text,
      eventType: 'submission',
    });

    await context.store.put(TRIGGER_KEY, response.results.webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    if (webhookId) {
      await paperformCommon.deleteWebhook({
        webhookId,
        auth: context.auth.secret_text,
      });
    }
  },
  async run(context) {
    const { formId } = context.propsValue;
    const payload = context.payload.body as Payload;

    const response = await paperformCommon.getSubmission({
      submissionId: payload.submission_id,
      auth: context.auth.secret_text,
    });

    const submission = response.results.submission;

    const fields = await paperformCommon.getFormFields({
      formSlugOrId: formId as string,
      auth: context.auth.secret_text,
    });

    const transformedFields = paperformCommon.transformSubmissionData(
      fields.results.fields,
      submission.data
    );

    return [
      {
        ...submission,
        data: transformedFields,
      },
    ];
  },
  async test(context) {
    const { formId } = context.propsValue;

    const response = await paperformCommon.getSubmissions({
      formId,
      auth: context.auth.secret_text,
      limit: 10,
    });

    if (response.results.submissions.length === 0) return [];

    const fields = await paperformCommon.getFormFields({
      formSlugOrId: formId as string,
      auth: context.auth.secret_text,
    });

    return response.results.submissions.map((submission) => {
      const transformedFields = paperformCommon.transformSubmissionData(
        fields.results.fields,
        submission.data
      );
      return {
        ...submission,
        data: transformedFields,
      };
    });
  },
  sampleData: {},
});

interface Payload {
  submission_id: string;
  form_id: string;
}
