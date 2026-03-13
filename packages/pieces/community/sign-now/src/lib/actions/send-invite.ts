import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const sendInviteAction = createAction({
  auth: signNowAuth,
  name: 'send_invite',
  displayName: 'Invite to Sign',
  description: 'Sends an invite to sign an existing document.',
  props: {
    document_id: Property.ShortText({
      displayName: 'Document ID',
      description: 'The ID of the document to send for signing.',
      required: true,
    }),
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'Must be the email address associated with your SignNow account.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description:
        'One entry per signer role. Each signer needs an email, role name, and signing order.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role: Property.ShortText({
          displayName: 'Role Name',
          description: 'Role name as defined in the document (e.g. "Signer 1").',
          required: true,
        }),
        order: Property.Number({
          displayName: 'Signing Order',
          description:
            'Order in which this signer receives the invite. Multiple signers can share the same order to sign in parallel.',
          required: true,
          defaultValue: 1,
        }),
        subject: Property.ShortText({
          displayName: 'Email Subject',
          description: 'Custom email subject for this signer.',
          required: false,
        }),
        message: Property.LongText({
          displayName: 'Email Message',
          description: 'Custom email body for this signer.',
          required: false,
        }),
        redirect_uri: Property.ShortText({
          displayName: 'Redirect URL',
          description: 'URL the signer is redirected to after signing.',
          required: false,
        }),
        language: Property.StaticDropdown({
          displayName: 'Language',
          description: "Language for this signer's signing session and emails.",
          required: false,
          options: {
            options: [
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' },
            ],
          },
        }),
        expiration_days: Property.Number({
          displayName: 'Expiration Days',
          description: 'Number of days before this signer\'s invite expires (3–180).',
          required: false,
        }),
      },
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject (All Signers)',
      description: 'Default email subject for all signers. Overridden by per-signer subject if set.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message (All Signers)',
      description: 'Default email body for all signers. Overridden by per-signer message if set.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
    cc_subject: Property.ShortText({
      displayName: 'CC Email Subject',
      description: 'Subject line for CC recipient emails.',
      required: false,
    }),
    cc_message: Property.LongText({
      displayName: 'CC Email Message',
      description: 'Body message for CC recipient emails.',
      required: false,
    }),
  },
  async run(context) {
    const {
      document_id,
      from,
      signers,
      subject,
      message,
      cc,
      cc_subject,
      cc_message,
    } = context.propsValue;

    const token = getSignNowBearerToken(context.auth);

    type SignerEntry = {
      email: string;
      role: string;
      order: number;
      subject?: string;
      message?: string;
      redirect_uri?: string;
      language?: string;
      expiration_days?: number;
    };

    const toArray = (signers as SignerEntry[]).map((signer) => {
      const entry: Record<string, unknown> = {
        email: signer.email,
        role: signer.role,
        order: signer.order,
      };
      if (signer.subject) entry['subject'] = signer.subject;
      if (signer.message) entry['message'] = signer.message;
      if (signer.redirect_uri) entry['redirect_uri'] = signer.redirect_uri;
      if (signer.language) entry['language'] = signer.language;
      if (signer.expiration_days) entry['expiration_days'] = signer.expiration_days;
      return entry;
    });

    const inviteBody: Record<string, unknown> = { to: toArray, from };
    if (subject) inviteBody['subject'] = subject;
    if (message) inviteBody['message'] = message;
    if (cc && (cc as string[]).length > 0) {
      inviteBody['cc'] = (cc as string[]).map((email) => ({ email }));
    }
    if (cc_subject) inviteBody['cc_subject'] = cc_subject;
    if (cc_message) inviteBody['cc_message'] = cc_message;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.signnow.com/document/${document_id}/invite`,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: inviteBody,
    });

    return response.body;
  },
});
