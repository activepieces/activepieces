import { createAction, Property } from '@activepieces/pieces-framework';
import { excelAuth } from '../auth';
import { GraphPermission, createMSGraphClientFromAuth, getItemPath, toPermissionSummary } from '../common/helpers';
import { excelAiProps } from '../common/ai-props';

export const excelShareWorkbook = createAction({
  auth: excelAuth,
  name: 'excel_share_workbook',
  classification: 'WRITE',
  displayName: 'Share Workbook',
  description: 'Grant specific people read or write access to a workbook.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Grant read or write access on a workbook to specific people by email; recipients must sign in, and no email is sent unless Send Invitation is on. Use excel_list_workbook_permissions to see existing access first. Each call adds grants and may re-send invitations, so do not blindly retry.',
    idempotent: false,
  },
  props: {
    ...excelAiProps.locationProps,
    workbookId: excelAiProps.workbookId,
    recipients: Property.Array({
      displayName: 'Recipient Emails',
      description: 'Email addresses of the people to share the workbook with.',
      required: true,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'Read lets recipients view, Write lets them edit.',
      required: true,
      defaultValue: 'read',
      options: {
        disabled: false,
        options: [
          { label: 'Read', value: 'read' },
          { label: 'Write', value: 'write' },
        ],
      },
    }),
    sendInvitation: Property.Checkbox({
      displayName: 'Send Invitation',
      description: 'If on, each recipient is emailed an invitation. Off grants access silently.',
      required: false,
      defaultValue: false,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Message included in the invitation email (only sent when Send Invitation is on).',
      required: false,
    }),
  },
  async run(context) {
    const { recipients, role, sendInvitation, message } = context.propsValue;
    const emails = (recipients ?? []).flatMap((recipient) =>
      typeof recipient === 'string' && recipient.trim() ? [recipient.trim()] : [],
    );
    if (emails.length === 0) {
      throw new Error('Provide at least one recipient email address.');
    }
    const trimmedMessage = message?.trim();
    const response: { value?: GraphPermission[] } = await createMSGraphClientFromAuth({ auth: context.auth })
      .api(`${getItemPath(context.propsValue)}/invite`)
      .post({
        recipients: emails.map((email) => ({ email })),
        roles: [role],
        requireSignIn: true,
        sendInvitation: sendInvitation === true,
        ...(trimmedMessage ? { message: trimmedMessage } : {}),
      });
    const permissions = (response.value ?? []).map(toPermissionSummary);
    return {
      permissions,
      count: permissions.length,
      invitationSent: sendInvitation === true,
    };
  },
});
