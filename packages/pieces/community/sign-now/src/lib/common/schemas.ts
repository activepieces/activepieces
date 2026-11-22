import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function webhookMeta(): OutputSchemaField {
  return {
    key: 'meta',
    label: 'Event Details',
    children: [
      { key: 'timestamp', label: 'Event Time (Unix Seconds)', format: 'number' },
      { key: 'event', label: 'Event Name' },
      { key: 'environment', label: 'API Environment', format: 'url' },
      { key: 'initiator_id', label: 'Initiator ID' },
      { key: 'callback_url', label: 'Callback URL', format: 'url' },
    ],
  };
}

function documentEvent({ withInitiator }: { withInitiator: boolean }): OutputSchema {
  return {
    fields: [
      webhookMeta(),
      {
        key: 'content',
        label: 'Document',
        children: [
          { key: 'document_id', label: 'Document ID' },
          { key: 'document_name', label: 'Document Name' },
          { key: 'user_id', label: 'Owner User ID' },
          ...(withInitiator
            ? [
                { key: 'initiator_id', label: 'Initiator ID' },
                { key: 'initiator_email', label: 'Initiator Email', format: 'email' as const },
              ]
            : []),
        ],
      },
    ],
  };
}

const inviteItem: OutputSchemaField[] = [
  { key: 'id', label: 'Invite ID' },
  { key: 'type', label: 'Invite Type' },
  { key: 'email', label: 'Signer Email', format: 'email' },
  { key: 'role', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
];

export const signNowSchemas: SignNowSchemas = {
  documentEvent,
  documentGroupEvent: {
    fields: [
      webhookMeta(),
      {
        key: 'content',
        label: 'Document Group',
        children: [
          { key: 'group_id', label: 'Document Group ID' },
          { key: 'group_name', label: 'Document Group Name' },
          { key: 'user_id', label: 'Owner User ID' },
          { key: 'initiator_id', label: 'Initiator ID' },
          { key: 'initiator_email', label: 'Initiator Email', format: 'email' },
          { key: 'completed_at', label: 'Completed At (Unix Seconds)' },
          {
            key: 'documents',
            label: 'Documents',
            labelKey: 'document_name',
            listItems: [
              { key: 'document_id', label: 'Document ID' },
              { key: 'document_name', label: 'Document Name' },
              { key: 'status', label: 'Status' },
            ],
          },
          {
            key: 'invite_steps',
            label: 'Invite Steps',
            listItems: [
              { key: 'order', label: 'Step Order' },
              { key: 'status', label: 'Status' },
              { key: 'signers', label: 'Signers' },
            ],
          },
        ],
      },
    ],
  },
  documentId: { fields: [{ key: 'id', label: 'Document ID' }] },
  status: { fields: [{ key: 'status', label: 'Status' }] },
  cancelInvite: {
    fields: [
      { key: 'status', label: 'Status' },
      { key: 'canceled_invite_ids', label: 'Canceled Free Form Invite IDs' },
      { key: 'canceled_field_invites', label: 'Field Invites Canceled', format: 'boolean' },
    ],
  },
  composite: {
    fields: [
      { key: 'document_id', label: 'Document ID' },
      { key: 'document_name', label: 'Document Name' },
      { key: 'invite', label: 'Invite Response', children: [{ key: 'id', label: 'Invite ID' }, { key: 'result', label: 'Result' }, { key: 'status', label: 'Status' }] },
    ],
  },
  groupComposite: {
    fields: [
      { key: 'document_group_id', label: 'Document Group ID' },
      { key: 'document_group_name', label: 'Document Group Name' },
      { key: 'invite_id', label: 'Invite ID' },
      { key: 'pending_invite_link', label: 'Pending Invite Link', format: 'url' },
      { key: 'documents', label: 'Documents', labelKey: 'name', listItems: [{ key: 'id', label: 'Document ID' }, { key: 'name', label: 'Document Name' }] },
    ],
  },
  documentList: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'total', label: 'Total Matching', format: 'number' },
      { key: 'truncated', label: 'More Results Exist', format: 'boolean' },
      {
        key: 'documents',
        label: 'Documents',
        labelKey: 'document_name',
        listItems: [
          { key: 'id', label: 'Document ID' },
          { key: 'document_name', label: 'Document Name' },
          { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
          { key: 'updated', label: 'Updated (Unix Seconds)', format: 'number' },
          { key: 'page_count', label: 'Page Count', format: 'number' },
          { key: 'roles', label: 'Role Names' },
          { key: 'invites', label: 'Invites', listItems: inviteItem },
        ],
      },
    ],
  },
  templateList: {
    fields: [
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'total', label: 'Total Templates', format: 'number' },
      { key: 'truncated', label: 'More Results Exist', format: 'boolean' },
      {
        key: 'templates',
        label: 'Templates',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Template ID' },
          { key: 'name', label: 'Template Name' },
          { key: 'updated', label: 'Updated (Unix Seconds)', format: 'number' },
          { key: 'roles', label: 'Role Names' },
        ],
      },
    ],
  },
  document: {
    fields: [
      { key: 'id', label: 'Document ID' },
      { key: 'document_name', label: 'Document Name' },
      { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
      { key: 'updated', label: 'Updated (Unix Seconds)', format: 'number' },
      { key: 'page_count', label: 'Page Count', format: 'number' },
      { key: 'owner', label: 'Owner Email', format: 'email' },
      { key: 'is_template', label: 'Is Template', format: 'boolean' },
      { key: 'field_count', label: 'Field Count', format: 'number' },
      { key: 'signature_count', label: 'Signature Count', format: 'number' },
      { key: 'roles', label: 'Roles', labelKey: 'name', listItems: [{ key: 'unique_id', label: 'Role ID' }, { key: 'name', label: 'Role Name' }, { key: 'signing_order', label: 'Signing Order', format: 'number' }] },
      { key: 'invites', label: 'Invites', labelKey: 'email', listItems: inviteItem },
    ],
  },
  createdDocument: {
    fields: [
      { key: 'id', label: 'Document ID' },
      { key: 'document_name', label: 'Document Name' },
    ],
  },
  freeFormInvite: {
    fields: [
      { key: 'id', label: 'Invite ID' },
      { key: 'result', label: 'Result' },
    ],
  },
  downloadLink: { fields: [{ key: 'link', label: 'Download Link', format: 'url' }] },
  downloadedFile: {
    fields: [
      { key: 'file', label: 'File', format: 'url' },
      { key: 'fileName', label: 'File Name' },
    ],
  },
  deletedDocument: {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'id', label: 'Document ID' },
    ],
  },
  documentGroup: {
    fields: [
      { key: 'id', label: 'Document Group ID' },
      { key: 'name', label: 'Document Group Name' },
      { key: 'invite_id', label: 'Invite ID' },
      { key: 'documents', label: 'Documents', labelKey: 'document_name', listItems: [{ key: 'id', label: 'Document ID' }, { key: 'document_name', label: 'Document Name' }, { key: 'roles', label: 'Role Names' }] },
    ],
  },
};

type SignNowSchemas = { documentEvent: (params: { withInitiator: boolean }) => OutputSchema } & Record<
  | 'documentGroupEvent'
  | 'documentId'
  | 'status'
  | 'cancelInvite'
  | 'composite'
  | 'groupComposite'
  | 'documentList'
  | 'templateList'
  | 'document'
  | 'createdDocument'
  | 'freeFormInvite'
  | 'downloadLink'
  | 'downloadedFile'
  | 'deletedDocument'
  | 'documentGroup',
  OutputSchema
>;
