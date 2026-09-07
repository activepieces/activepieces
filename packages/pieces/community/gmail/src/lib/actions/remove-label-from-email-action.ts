import { createAction } from '@activepieces/pieces-framework';
import { gmailAuth, createGoogleClient } from '../auth';
import { gmail as googleGmail } from '@googleapis/gmail';
import { GmailProps } from '../common/props';
import { gmailApiErrors } from '../common/gmail-errors';
import { gmailLabels } from '../common/gmail-labels';
import { gmailRemoveLabelFromEmailActionOutputSchema } from '../output-schemas';

export const gmailRemoveLabelFromEmailAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  classification: 'WRITE',
  displayName: 'Remove Label from Email',
  description: 'Remove a specific label from an email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Removes a label from a single email message identified by its Gmail message ID. Use Remove Label from Thread to strip the same label from every message in the conversation. Idempotent: removing a label the message does not carry succeeds without change.',
    idempotent: true,
  },
  props: {
    message_id: GmailProps.message,
    label: GmailProps.label({
      displayName: 'Label',
      description: 'The label to remove from the email.',
      required: true,
    }),
  },
  outputSchema: gmailRemoveLabelFromEmailActionOutputSchema,
  async run(context) {
    const authClient = await createGoogleClient(context.auth);
    const gmail = googleGmail({ version: 'v1', auth: authClient });
    const labelId = gmailLabels.resolveId(context.propsValue.label);

    try {
      const response = await gmail.users.messages.modify({
        userId: 'me',
        id: context.propsValue.message_id,
        requestBody: {
          removeLabelIds: [labelId],
        },
      });
      return response.data;
    } catch (error) {
      return gmailApiErrors.throwForAction({
        error,
        action: 'remove a label from the email',
        scopeHint: 'gmail.modify',
        notFoundMessage: `No message with ID "${context.propsValue.message_id}" was found.`,
        badRequestMessage: `Invalid label "${gmailLabels.resolveName(
          context.propsValue.label
        )}". It may have been deleted — refresh the label list and try again.`,
      });
    }
  },
});
