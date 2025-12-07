import { createAction, Property } from '@activepieces/pieces-framework';
import { gmailAuth } from '../../';
import { GmailProps } from '../common/props';
import { GmailLabel } from '../common/models';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const gmailAddLabelAction = createAction({
  auth: gmailAuth,
  name: 'add_label_to_email',
  description: 'Add a label to an individual email',
  displayName: 'Add Label to Email',
  props: {
    message_id: Property.ShortText({
      displayName: 'Message ID',
      description: 'The ID of the message to add the label to',
      required: true,
    }),
    label: {
      ...GmailProps.label,
      required: true,
    },
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const label = context.propsValue.label as GmailLabel;

    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: context.propsValue.message_id,
      requestBody: {
        addLabelIds: [label.id],
      },
    });

    return response.data;
  },
});
