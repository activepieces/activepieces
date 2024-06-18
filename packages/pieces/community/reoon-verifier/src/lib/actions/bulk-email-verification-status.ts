import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { verifyEmailsResult } from '../common/send-util';

export const bulkVerificationResult = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'bulkVerificationResult',
  displayName: 'Get Bulk Verification Result',
  description: 'Retrieves result of bulk verification email by task ID.',
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

    const response = await verifyEmailsResult(task_id, context.auth);

    return response.body;
  },
});
