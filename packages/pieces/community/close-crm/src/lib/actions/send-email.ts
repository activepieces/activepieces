import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { CLOSE_API_URL } from "../common/constants";
import { closeCrmAuth } from "../../index";

export const sendEmail = createAction({
  auth: closeCrmAuth,
  name: 'send_email',
  displayName: 'Send Email',
  description: 'Dispatch an email to a lead or contact directly from Close CRM.',
  props: {
    lead_id: Property.ShortText({
      displayName: 'Lead ID',
      description: 'ID of the lead to associate this email with.',
      required: true,
    }),
    to_emails: Property.ShortText({
      displayName: 'To Email(s)',
      description: 'Comma-separated list of recipient email addresses.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Subject',
      description: 'The subject line of the email.',
      required: true,
    }),
    body_html: Property.LongText({
      displayName: 'Body (HTML)',
      description: 'The HTML content of the email.',
      required: true,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID (Optional)',
      description: 'ID of a specific contact on the lead to associate this email with.',
      required: false,
    }),
    sender: Property.ShortText({
      displayName: 'Sender (Optional)',
      description: 'Sender email address. Can be in format "Name <email@example.com>". Defaults to API key owner if not set.',
      required: false,
    }),
    cc_emails: Property.ShortText({
      displayName: 'CC Email(s) (Optional)',
      description: 'Comma-separated list of CC recipient email addresses.',
      required: false,
    }),
    bcc_emails: Property.ShortText({
      displayName: 'BCC Email(s) (Optional)',
      description: 'Comma-separated list of BCC recipient email addresses.',
      required: false,
    }),
    user_id: Property.ShortText({
        displayName: 'User ID (Optional)',
        description: 'ID of the user to be marked as the sender. Defaults to the API key owner.',
        required: false,
    })
    // Attachments can be complex, involving a separate file upload step first.
    // We can consider adding Property.Json for 'attachments' later if needed.
  },
  async run(context) {
    const { lead_id, to_emails, subject, body_html, contact_id, sender, cc_emails, bcc_emails, user_id } = context.propsValue;
    const apiKey = context.auth;

    const payload: any = {
      lead_id: lead_id,
      to: to_emails.split(',').map(email => email.trim()).filter(email => email.length > 0),
      subject: subject,
      body_html: body_html,
      status: 'outbox', // To send the email
      direction: 'outgoing',
    };

    if (contact_id) payload.contact_id = contact_id;
    if (sender) payload.sender = sender;
    if (cc_emails) payload.cc = cc_emails.split(',').map(email => email.trim()).filter(email => email.length > 0);
    if (bcc_emails) payload.bcc = bcc_emails.split(',').map(email => email.trim()).filter(email => email.length > 0);
    if (user_id) payload.user_id = user_id;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${CLOSE_API_URL}/activity/email/`,
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${apiKey}:`).toString('base64'),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: payload,
    });

    return response.body;
  },
});
