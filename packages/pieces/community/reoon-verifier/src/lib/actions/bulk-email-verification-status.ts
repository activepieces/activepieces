import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { verifyEmailsResult } from '../common/send-util';

export const bulkVerificationResult = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'bulkVerificationResult',
  displayName: 'Get Bulk Verification Result',
  description: 'Retrieves result of bulk verification email by task ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetches the current status and verification results for a previously created bulk email verification task, identified by its task ID (obtained from the Create Bulk Email Verification action). Use to poll for or read back batch results. Idempotent: a read-only lookup that does not change the task.', idempotent: true },
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
