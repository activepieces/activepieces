import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { helpScoutApi } from '../../common/api';
import { helpScoutAuth } from '../../common/auth';
import { helpScoutOutputSchemas } from '../../common/output-schemas';

export const updateConversation = createAction({
  auth: helpScoutAuth,
  name: 'update_conversation',
  classification: 'WRITE',
  displayName: 'Update Conversation',
  description: 'Changes status, assignee, subject or mailbox of a conversation.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one or more attributes of a Help Scout conversation: status, assignee (user ID, or unassign "yes"), subject, or moves it to another mailbox. Only the supplied fields change, each applied as a separate update. Idempotent: repeating with the same values leaves the same state.',
    idempotent: true,
  },
  outputSchema: helpScoutOutputSchemas['updateConversation'],
  props: {
    conversationId: Property.Number({
      displayName: 'Conversation ID',
      description: 'Numeric Help Scout conversation ID (the id field from Search Conversations, not the #number shown in the UI).',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Pending', value: 'pending' },
          { label: 'Closed', value: 'closed' },
          { label: 'Spam', value: 'spam' },
        ],
      },
    }),
    assignTo: Property.Number({ displayName: 'Assign To User ID', required: false }),
    unassign: Property.StaticDropdown({
      displayName: 'Unassign',
      description: 'yes removes the current assignee. Ignored when Assign To User ID is set.',
      required: false,
      options: { disabled: false, options: [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }] },
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    mailboxId: Property.Number({ displayName: 'Move To Mailbox ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const assignTo = helpScoutApi.optionalNumber(propsValue.assignTo);
    const mailboxId = helpScoutApi.optionalNumber(propsValue.mailboxId);
    const operations: { op: string; path: string; value?: unknown }[] = [];
    if (propsValue.status) operations.push({ op: 'replace', path: '/status', value: propsValue.status });
    if (assignTo !== undefined) {
      operations.push({ op: 'replace', path: '/assignTo', value: assignTo });
    } else if (propsValue.unassign === 'yes') {
      operations.push({ op: 'remove', path: '/assignTo' });
    }
    if (propsValue.subject) operations.push({ op: 'replace', path: '/subject', value: propsValue.subject });
    if (mailboxId !== undefined) operations.push({ op: 'move', path: '/mailboxId', value: mailboxId });
    if (operations.length === 0) {
      throw new Error('Provide at least one field to change.');
    }
    const path = `/conversations/${helpScoutApi.encodeId(propsValue.conversationId)}`;
    const applied: string[] = [];
    for (const operation of operations) {
      await helpScoutApi.request({ method: HttpMethod.PATCH, path, auth, body: operation });
      applied.push(`${operation.op} ${operation.path}`);
    }
    return { conversationId: String(propsValue.conversationId), applied };
  },
});
