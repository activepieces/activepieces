import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  description: 'Attach a label to an individual email',
  displayName: 'Add Label to Email',
  props: {
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the email to which you want to add the label',
      required: true,
    }),
    labelId: Property.ShortText({
      displayName: 'Label ID',
      description: 'The ID of the label you want to add to the email',
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
        addLabelIds: [context.propsValue.labelId],
      },
    });

    return result.data;
  },
});
