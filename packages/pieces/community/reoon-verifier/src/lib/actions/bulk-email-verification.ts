import { reoonEmailVerifyAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { verifyEmails } from '../common/send-util';

export const bulkEmailVerification = createAction({
  auth: reoonEmailVerifyAuth,
  name: 'bulkEmailVerificationTask',
  displayName: 'Create Bulk Email Verification',
  description: 'Creates bulk email verification task.',
  audience: 'both',
  aiMetadata: { description: 'Submits a named batch of email addresses to the Reoon API for asynchronous bulk verification and returns the task identifier used to poll for results later (pair with the Get Bulk Verification Result action). Use when validating many addresses at once rather than one-by-one; emails may be passed as separate entries or comma-separated. Not idempotent: each call creates a new verification task.', idempotent: false },
  props: {
    taskName: Property.ShortText({
      displayName: 'Task Name',
      description: 'Name of the verification task',
      required: true,
    }),
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'Emails to verify (You can also provide multiple emails separated by comma)',
      required: true,
    }),
  },
  async run(context) {
    const emails = context.propsValue.emails as string[];

    // Each email field could be a comma separated list of emails so we need to split them
    const emailsToVerify = emails.reduce(
      (acc: string[], email: string) => [...acc, ...email.split(',')],
      []
    );

    const res = await verifyEmails(
      emailsToVerify,
      context.propsValue.taskName,
      context.auth.secret_text
    );

    return res.body;
  },
});
