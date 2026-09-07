import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailLabels } from '../common/gmail-labels';
import { gmailRemoveLabelFromThreadActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromThreadAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_thread',
  classification: 'WRITE',
  displayName: 'Remove Label from Thread',
  description: 'Remove a label from all emails in a thread.',
  audience: 'both',
  aiMetadata: {
    description:
      'Strips a label from every message in a Gmail thread identified by its thread ID. Use Remove Label from Email to remove the label from a single message instead. Idempotent: removing a label the thread does not carry succeeds without change.',
    idempotent: true,
  },
  props: {
    thread_id: GmailProps.thread,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from all emails in the thread.',
      required: true,
    }),
  },
  outputSchema: gmailRemoveLabelFromThreadActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const labelId = gmailLabels.resolveId(context.propsValue.label);

    try {
      const response = await gmail.users.threads.modify({
        userId: 'me',
        id: context.propsValue.thread_id,
        requestBody: {
          removeLabelIds: [labelId],
        },
      });
      return response.data;
    } catch (error) {
      return gmailApiErrors.throwForAction({
        error,
        action: 'remove a label from the thread',
        scopeHint: 'gmail.modify',
        notFoundMessage: `No thread with ID "${context.propsValue.thread_id}" was found.`,
        badRequestMessage: `Invalid label "${gmailLabels.resolveName(
          context.propsValue.label
        )}". It may have been deleted — refresh the label list and try again.`,
      });
    }
  },
});
