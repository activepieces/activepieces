import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailRemoveLabelAction = createAction({
  auth: gmailAuth,
  name: 'remove_label_from_email',
  description: 'Remove a specific label from an email',
  displayName: 'Remove Label from Email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description:
        'The ID of the email from which you want to remove the label',
      required: true,
    }),
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label you want to remove from the email',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const result = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.messageId,
      requestBody: {
        removeLabelIds: [context.propsValue.labelId],
      },
    });

    return result.data;
  },
});
