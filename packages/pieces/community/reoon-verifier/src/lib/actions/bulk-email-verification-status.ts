import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { verifyEmailsResult } from '../common/send-util';
import { getBulkEmailVerificationResultActionOutputSchema } from '../output-schemas';

export const bulkVerificationResult = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'bulkVerificationResult',
  classification: 'READ',
  displayName: 'Get Bulk Verification Result',
  description: 'Get the status and results of a bulk verification task.',
  audience: 'human',
  aiMetadata: { description: 'Fetches the current status and verification results for a previously created bulk email verification task, identified by its task ID (obtained from the Create Bulk Email Verification action). Use to poll for or read back batch results. Idempotent: a read-only lookup that does not change the task.', idempotent: true },
  outputSchema: getBulkEmailVerificationResultActionOutputSchema,
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description:
        'The task ID returned by a Create Bulk Email Verification step.',
      required: true,
    }),
  },
  async run(context) {
    const { task_id } = context.propsValue;

    const response = await verifyEmailsResult(task_id, context.auth.secret_text);

    return response.body;
  },
});
