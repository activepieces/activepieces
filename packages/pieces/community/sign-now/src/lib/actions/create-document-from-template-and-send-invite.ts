import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const createDocumentFromTemplateAndSendInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_from_template_and_send_invite',
  displayName: 'Create Document From Template & Send Free Form Invite',
  description:
    'Creates a new document from a template and sends a free form invite to a signer.',
  props: {
    template_id: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to create the document from.',
      required: true,
    }),
    document_name: Property.ShortText({
      displayName: 'Document Name',
      description: 'Name for the new document. Defaults to the template name if not provided.',
      required: false,
    }),
    to: Property.ShortText({
      displayName: "Signer's Email",
      description: "Email address of the signer. A free form invite can be sent to the sender's own email address.",
      required: true,
    }),
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'Must be the email address associated with your SignNow account.',
      required: true,
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject',
      description: 'Subject line of the invite email sent to the signer.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message',
      description: 'Body message of the invite email sent to the signer.',
      required: false,
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
    cc_subject: Property.ShortText({
      displayName: 'CC Email Subject',
      description: 'Subject line of the email sent to CC recipients.',
      required: false,
    }),
    cc_message: Property.LongText({
      displayName: 'CC Email Message',
      description: 'Body message of the email sent to CC recipients.',
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language for the signing session and notification emails.',
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
        ],
      },
    }),
    redirect_uri: Property.ShortText({
      displayName: 'Redirect URL',
      description: 'URL the signer is redirected to after signing.',
      required: false,
    }),
    close_redirect_uri: Property.ShortText({
      displayName: 'Close Redirect URL',
      description: 'URL that opens when the signer clicks the Close button.',
      required: false,
    }),
    redirect_target: Property.StaticDropdown({
      displayName: 'Redirect Target',
      description: 'Whether to open the redirect URL in a new tab or the same tab.',
      required: false,
      options: {
        options: [
          { label: 'New tab', value: 'blank' },
          { label: 'Same tab', value: 'self' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      template_id,
      document_name,
      to,
      from,
      subject,
      message,
      cc,
      cc_subject,
      cc_message,
      language,
      redirect_uri,
      close_redirect_uri,
      redirect_target,
    } = context.propsValue;

    const token = getSignNowBearerToken(context.auth);

    // Step 1: Create document from template
    let document_id: string;
    let createdDocumentName: string;

    try {
      const createResponse = await httpClient.sendRequest<{ id: string; document_name: string }>({
        method: HttpMethod.POST,
        url: `https://api.signnow.com/template/${template_id}/copy`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          ...(document_name ? { document_name } : {}),
        },
      });
      document_id = createResponse.body.id;
      createdDocumentName = createResponse.body.document_name;
    } catch (e) {
      throw new Error(`Failed to create document from template: ${(e as Error).message}`);
    }

    // Step 2: Send free form invite
    const inviteBody: Record<string, unknown> = { to, from };
    if (subject) inviteBody['subject'] = subject;
    if (message) inviteBody['message'] = message;
    if (cc && (cc as string[]).length > 0) inviteBody['cc'] = cc;
    if (cc_subject) inviteBody['cc_subject'] = cc_subject;
    if (cc_message) inviteBody['cc_message'] = cc_message;
    if (language) inviteBody['language'] = language;
    if (redirect_uri) inviteBody['redirect_uri'] = redirect_uri;
    if (close_redirect_uri) inviteBody['close_redirect_uri'] = close_redirect_uri;
    if (redirect_target) inviteBody['redirect_target'] = redirect_target;

    try {
      const inviteResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `https://api.signnow.com/document/${document_id}/invite`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: inviteBody,
      });

      return {
        document_id,
        document_name: createdDocumentName,
        invite: inviteResponse.body,
      };
    } catch (e) {
      throw new Error(
        `Document was created (ID: ${document_id}, Name: "${createdDocumentName}") but sending the invite failed: ${(e as Error).message}`
      );
    }
  },
});
