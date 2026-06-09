import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const createDocumentFromTemplateAndSendRoleBasedInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_from_template_and_send_role_based_invite',
  displayName: 'Create Document From Template & Send Role-Based Invite',
  description:
    'Creates a new document from a template with fillable fields and sends an invite to one or more signers by role.',
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
    from: Property.ShortText({
      displayName: "Sender's Email",
      description: 'Must be the email address associated with your SignNow account.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description:
        'One entry per signer role defined in the template. Each signer must have an email and a role name (e.g. "Signer 1").',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role: Property.ShortText({
          displayName: 'Role Name',
          description: 'Role name as defined in the template (e.g. "Signer 1").',
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
      },
    }),
    subject: Property.ShortText({
      displayName: 'Email Subject (All Signers)',
      description: 'Default email subject sent to all signers. Overridden by per-signer subject if set.',
      required: false,
    }),
    message: Property.LongText({
      displayName: 'Email Message (All Signers)',
      description: 'Default email body sent to all signers. Overridden by per-signer message if set.',
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
    expiration_days: Property.Number({
      displayName: 'Expiration Days',
      description: 'Number of days before the invite expires (3–180). Defaults to 30.',
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
  },
  async run(context) {
    const {
      template_id,
      document_name,
      from,
      signers,
      subject,
      message,
      cc,
      cc_subject,
      cc_message,
      expiration_days,
      language,
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

    // Step 2: Send role-based field invite
    type SignerEntry = {
      email: string;
      role: string;
      order: number;
      subject?: string;
      message?: string;
      redirect_uri?: string;
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
    if (expiration_days) inviteBody['expiration_days'] = expiration_days;
    if (language) inviteBody['language'] = language;

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
