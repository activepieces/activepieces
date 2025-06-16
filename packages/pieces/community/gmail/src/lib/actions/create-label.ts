import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailCreateLabelAction = createAction({
  auth: gmailAuth,
  name: 'create_label',
  description: 'Create a new user label in Gmail',
  displayName: 'Create Label',
  props: {
    labelName: Property.ShortText({
      displayName: 'Label Name',
      description: 'The name of the new label to create',
      required: true,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const result = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: context.propsValue.labelName,
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show',
      },
    });

    return result.data;
  },
});
