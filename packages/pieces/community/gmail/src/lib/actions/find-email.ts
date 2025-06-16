import { createAction, Property } from '@activepieces/pieces-framework';
import { OAuth2Client } from 'googleapis-common';
import { google } from 'googleapis';
import { gmailAuth } from '../../';

export const gmailFindEmailAction = createAction({
  auth: gmailAuth,
  name: 'find_email',
  description:
    'Locate a specific email using search keywords like subject, sender, or content.',
  displayName: 'Find Email',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Use Gmail search operators like subject, sender, content, etc. Example: "subject:Meeting from:john@example.com"',
      required: true,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: 'Maximum number of emails to retrieve (default is 1)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);

    const gmail = google.gmail({ version: 'v1', auth: authClient });

    const result = await gmail.users.messages.list({
      userId: 'me',
      q: context.propsValue.query,
      maxResults: context.propsValue.maxResults || 1,
    });

    if (!result.data.messages || result.data.messages.length === 0) {
      return { found: false, message: 'No emails found.' };
    }

    const emails = await Promise.all(
      result.data.messages.map(async (message) => {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id as string,
          format: 'full',
        });
        return messageDetails.data;
      })
    );

    return {
      found: true,
      emails,
    };
  },
});
