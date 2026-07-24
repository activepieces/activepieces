import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { verifyEmailsResult } from '../common/send-util';

export const getBulkEmailVerificationResult = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'get_bulk_email_verification_result',
  displayName: 'Get Bulk Email Verification Result',
  description: 'Reads the status and results of a bulk verification task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the current status and verification results of a bulk email verification task by its task_id. The task_id is obtained from the Create Bulk Email Verification action (run that first); poll this until the task reports complete. Read-only — does not change the task or consume additional verification credits.',
    idempotent: true,
  },
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'Provide the task ID for the bulk verification task. You can fetch this from the `Create Bulk Email Verification` action.',
      required: true,
    }),
  },
  async run(context) {
    const { task_id } = context.propsValue;

    const response = await verifyEmailsResult(task_id, context.auth.secret_text);

    return response.body;
  },
});
