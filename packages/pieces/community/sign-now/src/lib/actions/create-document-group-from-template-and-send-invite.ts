import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { signNowAuth, getSignNowBearerToken } from '../common/auth';

export const createDocumentGroupFromTemplateAndSendInviteAction = createAction({
  auth: signNowAuth,
  name: 'create_document_group_from_template_and_send_invite',
  displayName: 'Create Document Group From Template Group & Send Invite',
  description:
    'Creates a new document group from a template group and sends an invite to one or more signers.',
  props: {
    template_id: Property.ShortText({
      displayName: 'Document Group Template ID',
      description: 'The unique ID of the document group template.',
      required: true,
    }),
    group_name: Property.ShortText({
      displayName: 'Document Group Name',
      description: 'Name for the new document group.',
      required: true,
    }),
    signers: Property.Array({
      displayName: 'Signers',
      description:
        'One entry per signer. Each signer needs an email, role name, and the document they are signing within the group. Signing order determines the step sequence.',
      required: true,
      properties: {
        email: Property.ShortText({
          displayName: 'Email',
          description: "Signer's email address.",
          required: true,
        }),
        role_name: Property.ShortText({
          displayName: 'Role Name',
          description: 'Role name as defined in the template (e.g. "Signer 1").',
          required: true,
        }),
        document_id: Property.ShortText({
          displayName: 'Document ID',
          description:
            'ID of the specific document within the group this signer is assigned to. Leave blank to assign to all documents.',
          required: false,
        }),
        action: Property.StaticDropdown({
          displayName: 'Action',
          description: 'What this recipient is allowed to do with the document.',
          required: true,
          options: {
            options: [
              { label: 'Sign', value: 'sign' },
              { label: 'Approve', value: 'approve' },
              { label: 'View', value: 'view' },
            ],
          },
        }),
        order: Property.Number({
          displayName: 'Signing Step',
          description:
            'Step order for this signer (1 = first). Signers with the same step number act in parallel.',
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
        language: Property.StaticDropdown({
          displayName: 'Language',
          description: 'Language for this signer\'s signing session and emails.',
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
          description: 'URL the signer is redirected to after completing the document.',
          required: false,
        }),
      },
    }),
    cc: Property.Array({
      displayName: 'CC Recipients',
      description: 'Email addresses to CC on the invite.',
      required: false,
    }),
  },
  async run(context) {
    const { template_id, group_name, signers, cc } = context.propsValue;
    const token = getSignNowBearerToken(context.auth);

    // Step 1: Create document group from template
    type DocumentGroupResponse = {
      data: {
        unique_id: string;
        name: string;
        documents: Array<{ id: string; document_name: string; roles: string[] }>;
      };
    };

    let documentGroupId: string;
    let documents: DocumentGroupResponse['data']['documents'];

    try {
      const createResponse = await httpClient.sendRequest<DocumentGroupResponse>({
        method: HttpMethod.POST,
        url: `https://api.signnow.com/v2/document-group-templates/${template_id}/document-group`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: { group_name },
      });
      documentGroupId = createResponse.body.data.unique_id;
      documents = createResponse.body.data.documents;
    } catch (e) {
      throw new Error(`Failed to create document group from template: ${(e as Error).message}`);
    }

    // Step 2: Build invite_steps by grouping signers by their order/step
    type SignerEntry = {
      email: string;
      role_name: string;
      document_id?: string;
      action: string;
      order: number;
      subject?: string;
      message?: string;
      language?: string;
      redirect_uri?: string;
    };

    // Group signers by step order
    const stepMap = new Map<number, SignerEntry[]>();
    for (const signer of signers as SignerEntry[]) {
      const step = signer.order ?? 1;
      if (!stepMap.has(step)) stepMap.set(step, []);
      stepMap.get(step)!.push(signer);
    }

    const invite_steps = Array.from(stepMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([order, stepSigners]) => {
        const invite_actions = stepSigners.map((signer) => {
          // If no document_id provided, use the first document in the group
          const targetDocId =
            signer.document_id || (documents.length > 0 ? documents[0].id : '');

          const action: Record<string, unknown> = {
            email: signer.email,
            role_name: signer.role_name,
            action: signer.action,
            document_id: targetDocId,
          };
          if (signer.redirect_uri) action['redirect_uri'] = signer.redirect_uri;
          if (signer.language) action['language'] = signer.language;
          return action;
        });

        const invite_emails = stepSigners
          .filter((s) => s.subject || s.message)
          .map((signer) => {
            const emailEntry: Record<string, unknown> = { email: signer.email };
            if (signer.subject) emailEntry['subject'] = signer.subject;
            if (signer.message) emailEntry['message'] = signer.message;
            return emailEntry;
          });

        const step: Record<string, unknown> = { order, invite_actions };
        if (invite_emails.length > 0) step['invite_emails'] = invite_emails;
        return step;
      });

    const inviteBody: Record<string, unknown> = { invite_steps };
    if (cc && (cc as string[]).length > 0) inviteBody['cc'] = cc;

    // Step 3: Send document group invite
    try {
      const inviteResponse = await httpClient.sendRequest<{ id: string; pending_invite_link: string | null }>({
        method: HttpMethod.POST,
        url: `https://api.signnow.com/documentgroup/${documentGroupId}/groupinvite`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: inviteBody,
      });

      return {
        document_group_id: documentGroupId,
        document_group_name: group_name,
        invite_id: inviteResponse.body.id,
        pending_invite_link: inviteResponse.body.pending_invite_link,
        documents: documents.map((d) => ({ id: d.id, name: d.document_name })),
      };
    } catch (e) {
      throw new Error(
        `Document group was created (ID: ${documentGroupId}) but sending the invite failed: ${(e as Error).message}`
      );
    }
  },
});
