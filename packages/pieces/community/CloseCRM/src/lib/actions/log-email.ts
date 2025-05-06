import { Property, createAction } from '@activepieces/pieces-framework';
import { closeAuth } from '../..';
import { makeClient } from '../common/client';
import { CloseCRMEmailActivity } from '../common/types';

export const logEmail = createAction({
  auth: closeAuth,
  name: 'log_email',
  displayName: 'Log Email',
  description: 'Logs an email activity to a lead/contact in Close CRM',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead/contact to log the email against',
      required: true,
    }),
    direction: Property.StaticDropdown({
      displayName: 'Direction',
      description: 'Was this email sent or received?',
      required: true,
      options: {
        options: [
          { label: 'Outgoing', value: 'outgoing' },
          { label: 'Incoming', value: 'incoming' },
        ],
      },
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      required: true,
    }),
    body: Property.LongText({
      displayName: 'Email Body',
      required: true,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'When the email was sent/received',
      required: false,
    }),
    sender: Property.ShortText({
      displayName: 'Sender Email',
      description: 'Required for incoming emails',
      required: false,
    }),
    recipients: Property.Array({
      displayName: 'Recipients',
      description: 'List of email recipients',
      required: false,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          required: true,
        }),
        name: Property.ShortText({
          displayName: 'Name',
          required: false,
        }),
      },
    }),
    attachments: Property.Array({
      displayName: 'Attachments',
      required: false,
      properties: {
        filename: Property.ShortText({
          displayName: 'Filename',
          required: true,
        }),
        url: Property.ShortText({
          displayName: 'File URL',
          description: 'Publicly accessible URL of the attachment',
          required: true,
        }),
        size: Property.Number({
          displayName: 'File Size (bytes)',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      lead_id,
      direction,
      subject,
      body,
      date,
      sender,
      recipients,
      attachments
    } = context.propsValue;

    const client = makeClient(context.auth);

    const emailData: CloseCRMEmailActivity = {
        lead_id,
        direction,
        note: body,
        date_created: date ?? new Date().toISOString(),
        _type: 'email',
        email: {
          subject,
          body,
          ...(direction === 'incoming' && { sender }), // Only include sender for incoming emails
          to: recipients ? recipients.map(r => ({
            email: r.email,
            ...(r.name && { name: r.name })
          })) : [],
          ...(attachments && attachments.length > 0 && {
            attachments: attachments.map(a => ({
              name: a.filename,
              url: a.url,
              ...(a.size && { size: a.size })
            }))
          })
        }
      };
    try {
      const response = await client.post('/activity/email/', emailData);
      return response.data;
    } catch (error) {
      console.error('Error logging email:', error);
      throw new Error(`Failed to log email: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});