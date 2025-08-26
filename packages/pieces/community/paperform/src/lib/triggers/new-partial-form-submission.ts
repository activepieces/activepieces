import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { paperformCommonProps } from '../common/props';

const TRIGGER_KEY = 'new_partial_form_submission';

export const newPartialFormSubmission = createTrigger({
  auth: paperformAuth,
  name: 'new_partial_form_submission',
  displayName: 'New Partial Form Submission',
  description: 'Triggers when a partial/in-progress submission is received.',
  props: {
    formId: paperformCommonProps.formId,
  },

  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const formId = context.propsValue.formId;
    const response = await paperformCommon.createWebhook({
      formId,
      webhookUrl: context.webhookUrl,
      auth: context.auth,
      eventType: 'partial_submission',
    });

    await context.store.put(TRIGGER_KEY, response.results.webhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(TRIGGER_KEY);
    if (webhookId) {
      await paperformCommon.deleteWebhook({
        webhookId,
        auth: context.auth,
      });
    }
  },
  async run(context) {
    const { formId } = context.propsValue;
    const payload = context.payload.body as Payload;

    const response = await paperformCommon.getPartialSubmission({
      submissionId: payload.submission_id,
      auth: context.auth,
    });

    const submission = response.results['partial-submission'];

    const fields = await paperformCommon.getFormFields({
      formSlugOrId: formId as string,
      auth: context.auth as string,
    });

    const transformedFields =
      Array.isArray(submission.data) && submission.data.length === 0
        ? {}
        : paperformCommon.transformSubmissionData(
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

    const response = await paperformCommon.getPartialSubmissions({
      formSlugOrId: formId,
      auth: context.auth,
      limit: 10,
    });

    if (response.results['partial-submissions'].length === 0) return [];

    const fields = await paperformCommon.getFormFields({
      formSlugOrId: formId as string,
      auth: context.auth as string,
    });

    return response.results['partial-submissions'].map((submission) => {
      if (Array.isArray(submission.data) && submission.data.length === 0) {
        return {
          ...submission,
          data: {},
        };
      }

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
