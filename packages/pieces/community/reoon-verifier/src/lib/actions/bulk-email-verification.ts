import { reoonEmailVerifyAuth } from '../..';
import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { splitEmails, verifyEmails } from '../common/send-util';
import { createBulkEmailVerificationActionOutputSchema } from '../output-schemas';

export const bulkEmailVerification = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'bulkEmailVerificationTask',
  classification: 'WRITE',
  displayName: 'Create Bulk Email Verification',
  description: 'Start verifying a list of email addresses in the background.',
  audience: 'human',
  aiMetadata: { description: 'Submits a named batch of email addresses to the Reoon API for asynchronous bulk verification and returns the task identifier used to poll for results later (pair with the Get Bulk Verification Result action). Use when validating many addresses at once rather than one-by-one; emails may be passed as separate entries or comma-separated. Not idempotent: each call creates a new verification task.', idempotent: false },
  outputSchema: createBulkEmailVerificationActionOutputSchema,
  props: {
    taskName: Property.ShortText({
      displayName: 'Task Name',
      description: 'A name to find this batch in your Reoon dashboard.',
      placeholder: 'March newsletter list',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'One address per item, or several in one item separated by commas.',
      required: true,
    }),
    results_note: Property.MarkDown({
      value:
        'Results are not ready right away. Add a **Get Bulk Verification Result** step and map the task ID this step returns.',
      variant: MarkdownVariant.INFO,
    }),
  },
  async run(context) {
    const emailsToVerify = splitEmails(context.propsValue.emails);

    const res = await verifyEmails(
      emailsToVerify,
      context.propsValue.taskName,
      context.auth.secret_text
    );

    return res.body;
  },
});
