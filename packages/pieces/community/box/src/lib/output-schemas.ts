import { OutputSchema } from '@activepieces/pieces-framework';

const userRefFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'login', label: 'Login Email', format: 'email' },
];

const groupRefFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Group ID' },
  { key: 'name', label: 'Name' },
  { key: 'group_type', label: 'Group Type' },
];

const aiAgentInfoFields: OutputSchema['fields'] = [
  {
    key: 'models',
    label: 'Models',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'provider', label: 'Provider' },
    ],
  },
  { key: 'processor', label: 'Processor' },
];

const taxonomyLevelFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'level', label: 'Level', format: 'number' },
];

const fileVersionRefFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'File Version ID' },
  { key: 'sha1', label: 'SHA-1 Hash' },
];

const fileRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'File ID' },
  { key: 'type', label: 'Type' },
  {
    key: 'file_version',
    label: 'File Version',
    children: fileVersionRefFields,
  },
  { key: 'name', label: 'Name' },
  { key: 'sequence_id', label: 'Sequence ID' },
  { key: 'etag', label: 'ETag' },
  { key: 'sha1', label: 'SHA-1 Hash' },
];

const taskAssignmentFields: OutputSchema['fields'] = [
  { key: 'message', label: 'Message' },
  { key: 'assigned_at', label: 'Assigned At', format: 'datetime' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Task Assignment ID' },
  { key: 'item', label: 'Item', children: fileRefFields },
  { key: 'assigned_to', label: 'Assigned To', children: userRefFields },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'reminded_at', label: 'Reminded At', format: 'datetime' },
  { key: 'resolution_state', label: 'Resolution State' },
  { key: 'assigned_by', label: 'Assigned By', children: userRefFields },
];

const folderRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'etag', label: 'ETag' },
  { key: 'type', label: 'Type' },
  { key: 'sequence_id', label: 'Sequence ID' },
  { key: 'name', label: 'Name' },
];

const signRequestFields: OutputSchema['fields'] = [
  {
    key: 'is_document_preparation_needed',
    label: 'Document Preparation Needed',
    format: 'boolean',
  },
  { key: 'redirect_url', label: 'Redirect URL' },
  { key: 'declined_redirect_url', label: 'Declined Redirect URL' },
  {
    key: 'are_text_signatures_enabled',
    label: 'Text Signatures Enabled',
    format: 'boolean',
  },
  { key: 'signature_color', label: 'Signature Color' },
  { key: 'email_subject', label: 'Email Subject' },
  { key: 'email_message', label: 'Email Message' },
  {
    key: 'are_reminders_enabled',
    label: 'Reminders Enabled',
    format: 'boolean',
  },
  {
    key: 'signers',
    label: 'Signers',
    labelKey: 'email',
    listItems: [
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'role', label: 'Role' },
      { key: 'is_in_person', label: 'In Person', format: 'boolean' },
      { key: 'order', label: 'Signing Order', format: 'number' },
      { key: 'verification_phone_number', label: 'Verification Phone Number' },
      {
        key: 'embed_url_external_user_id',
        label: 'Embed URL External User ID',
      },
      { key: 'redirect_url', label: 'Redirect URL' },
      { key: 'declined_redirect_url', label: 'Declined Redirect URL' },
      { key: 'login_required', label: 'Login Required', format: 'boolean' },
      {
        key: 'has_viewed_document',
        label: 'Viewed Document',
        format: 'boolean',
      },
      { key: 'signer_decision', label: 'Signer Decision' },
      { key: 'signer_group_id', label: 'Signer Group ID' },
      { key: 'inputs', label: 'Inputs' },
      { key: 'embed_url', label: 'Embed URL' },
      { key: 'iframeable_embed_url', label: 'Iframeable Embed URL' },
      {
        key: 'suppress_notifications',
        label: 'Suppress Notifications',
        format: 'boolean',
      },
      { key: 'smart_card_required_type', label: 'Smart Card Required Type' },
      { key: 'attachments', label: 'Attachments' },
      { key: 'language', label: 'Language' },
      { key: 'verification_method', label: 'Verification Method' },
    ],
  },
  { key: 'id', label: 'Sign Request ID' },
  { key: 'prefill_tags', label: 'Prefill Tags' },
  { key: 'days_valid', label: 'Days Valid' },
  { key: 'prepare_url', label: 'Prepare URL' },
  {
    key: 'source_files',
    label: 'Source Files',
    labelKey: 'name',
    listItems: fileRefFields,
  },
  { key: 'parent_folder', label: 'Parent Folder', children: folderRefFields },
  { key: 'name', label: 'Name' },
  { key: 'external_id', label: 'External ID' },
  { key: 'type', label: 'Type' },
  { key: 'signing_log', label: 'Signing Log' },
  { key: 'status', label: 'Status' },
  {
    key: 'sign_files',
    label: 'Sign Files',
    children: [
      {
        key: 'files',
        label: 'Files',
        labelKey: 'name',
        listItems: fileRefFields,
      },
      {
        key: 'is_ready_for_download',
        label: 'Ready For Download',
        format: 'boolean',
      },
    ],
  },
  { key: 'auto_expire_at', label: 'Auto Expire At', format: 'datetime' },
  { key: 'template_id', label: 'Template ID' },
  { key: 'external_system_name', label: 'External System Name' },
  { key: 'collaborator_level', label: 'Collaborator Level' },
  { key: 'sender_email', label: 'Sender Email', format: 'email' },
  { key: 'sender_id', label: 'Sender ID' },
  { key: 'batch_send_id', label: 'Batch Send ID' },
  { key: 'short_id', label: 'Short ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'finished_at', label: 'Finished At', format: 'datetime' },
  { key: 'error_code', label: 'Error Code' },
  { key: 'request_flow', label: 'Request Flow' },
];

const pathCollectionFields: OutputSchema['fields'] = [
  { key: 'total_count', label: 'Total Count', format: 'number' },
  {
    key: 'entries',
    label: 'Folders',
    labelKey: 'name',
    listItems: folderRefFields,
  },
];

const fileFields: OutputSchema['fields'] = [
  ...fileRefFields,
  { key: 'description', label: 'Description' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'path_collection', label: 'Path', children: pathCollectionFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
  { key: 'purged_at', label: 'Purged At', format: 'datetime' },
  {
    key: 'content_created_at',
    label: 'Content Created At',
    format: 'datetime',
  },
  {
    key: 'content_modified_at',
    label: 'Content Modified At',
    format: 'datetime',
  },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'modified_by', label: 'Modified By', children: userRefFields },
  { key: 'owned_by', label: 'Owner', children: userRefFields },
  { key: 'shared_link', label: 'Shared Link' },
  { key: 'parent', label: 'Parent Folder', children: folderRefFields },
  { key: 'item_status', label: 'Item Status' },
];

const folderFields: OutputSchema['fields'] = [
  ...folderRefFields,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'description', label: 'Description' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'path_collection', label: 'Path', children: pathCollectionFields },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'modified_by', label: 'Modified By', children: userRefFields },
  { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
  { key: 'purged_at', label: 'Purged At', format: 'datetime' },
  {
    key: 'content_created_at',
    label: 'Content Created At',
    format: 'datetime',
  },
  {
    key: 'content_modified_at',
    label: 'Content Modified At',
    format: 'datetime',
  },
  { key: 'owned_by', label: 'Owner', children: userRefFields },
  { key: 'shared_link', label: 'Shared Link' },
  { key: 'folder_upload_email', label: 'Folder Upload Email' },
  { key: 'parent', label: 'Parent Folder', children: folderRefFields },
  { key: 'item_status', label: 'Item Status' },
];

const sortOrderFields: OutputSchema['fields'] = [
  { key: 'by', label: 'Sorted By' },
  { key: 'direction', label: 'Sort Direction' },
];

const collaboratorFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Collaborator ID' },
  { key: 'name', label: 'Name' },
  { key: 'login', label: 'Login Email', format: 'email' },
  { key: 'is_active', label: 'Active', format: 'boolean' },
  { key: 'group_type', label: 'Group Type' },
];

const objectRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Comment ID' },
  { key: 'is_reply_comment', label: 'Reply Comment', format: 'boolean' },
  { key: 'message', label: 'Message' },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'item', label: 'Item', children: objectRefFields },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
];

const emailAliasFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Email Alias ID' },
  { key: 'is_confirmed', label: 'Confirmed', format: 'boolean' },
  { key: 'email', label: 'Email', format: 'email' },
];

const metadataInstanceFields: OutputSchema['fields'] = [
  { key: '$id', label: 'Metadata Instance ID' },
  { key: '$type', label: 'Type Key' },
  { key: '$template', label: 'Template Key' },
  { key: '$parent', label: 'Parent' },
  { key: '$scope', label: 'Scope' },
  { key: '$typeVersion', label: 'Template Version', format: 'number' },
  { key: '$version', label: 'Instance Version', format: 'number' },
  { key: '$canEdit', label: 'Can Edit', format: 'boolean' },
];

const folderLockFields: OutputSchema['fields'] = [
  { key: 'folder', label: 'Folder', children: folderRefFields },
  { key: 'id', label: 'Folder Lock ID' },
  { key: 'type', label: 'Type' },
  { key: 'created_by', label: 'Created By', children: objectRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'lock_type', label: 'Lock Type' },
  {
    key: 'locked_operations',
    label: 'Locked Operations',
    children: [
      { key: 'move', label: 'Move', format: 'boolean' },
      { key: 'delete', label: 'Delete', format: 'boolean' },
    ],
  },
];

const metadataCascadePolicyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Cascade Policy ID' },
  { key: 'type', label: 'Type' },
  {
    key: 'owner_enterprise',
    label: 'Owner Enterprise',
    children: objectRefFields,
  },
  { key: 'parent', label: 'Parent Folder', children: objectRefFields },
  { key: 'scope', label: 'Scope' },
  { key: 'templateKey', label: 'Template Key' },
];

const metadataTemplateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Metadata Template ID' },
  { key: 'type', label: 'Type' },
  { key: 'templateKey', label: 'Template Key' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  {
    key: 'copyInstanceOnItemCopy',
    label: 'Copy Instance On Item Copy',
    format: 'boolean',
  },
  {
    key: 'fields',
    label: 'Fields',
    labelKey: 'displayName',
    listItems: [
      { key: 'id', label: 'Field ID' },
      { key: 'type', label: 'Type' },
      { key: 'key', label: 'Key' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'hidden', label: 'Hidden', format: 'boolean' },
    ],
  },
  { key: 'scope', label: 'Scope' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'item', label: 'Item', children: fileRefFields },
  { key: 'id', label: 'Task ID' },
  { key: 'type', label: 'Type' },
  { key: 'due_at', label: 'Due At', format: 'datetime' },
  { key: 'action', label: 'Action' },
  { key: 'message', label: 'Message' },
  {
    key: 'task_assignment_collection',
    label: 'Task Assignment Collection',
    children: [
      { key: 'total_count', label: 'Total Count', format: 'number' },
      { key: 'entries', label: 'Items' },
    ],
  },
  { key: 'is_completed', label: 'Completed', format: 'boolean' },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'completion_rule', label: 'Completion Rule' },
];

const userFields: OutputSchema['fields'] = [
  ...userRefFields,
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'language', label: 'Language' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'space_amount', label: 'Space Amount', format: 'filesize' },
  { key: 'space_used', label: 'Space Used', format: 'filesize' },
  { key: 'max_upload_size', label: 'Max Upload Size', format: 'filesize' },
  { key: 'status', label: 'Status' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'avatar_url', label: 'Avatar URL', format: 'image' },
  { key: 'notification_email', label: 'Notification Email' },
];

const webLinkFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Web Link ID' },
  { key: 'sequence_id', label: 'Sequence ID' },
  { key: 'etag', label: 'ETag' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'parent', label: 'Parent Folder', children: folderRefFields },
  { key: 'description', label: 'Description' },
  { key: 'item_status', label: 'Item Status' },
  { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
  { key: 'purged_at', label: 'Purged At', format: 'datetime' },
  { key: 'shared_link', label: 'Shared Link' },
  { key: 'path_collection', label: 'Path', children: pathCollectionFields },
  { key: 'modified_by', label: 'Modified By', children: userRefFields },
  { key: 'owned_by', label: 'Owner', children: userRefFields },
];

const sharedLinkPermissionFields: OutputSchema['fields'] = [
  { key: 'can_preview', label: 'Can Preview', format: 'boolean' },
  { key: 'can_download', label: 'Can Download', format: 'boolean' },
  { key: 'can_edit', label: 'Can Edit', format: 'boolean' },
];

const sharedLinkFields: OutputSchema['fields'] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'download_url', label: 'Download URL', format: 'url' },
  { key: 'vanity_url', label: 'Vanity URL' },
  { key: 'vanity_name', label: 'Vanity Name' },
  { key: 'effective_access', label: 'Effective Access' },
  { key: 'effective_permission', label: 'Effective Permission' },
  {
    key: 'is_password_enabled',
    label: 'Password Protected',
    format: 'boolean',
  },
  { key: 'unshared_at', label: 'Unshared At', format: 'datetime' },
  { key: 'download_count', label: 'Download Count', format: 'number' },
  { key: 'preview_count', label: 'Preview Count', format: 'number' },
  { key: 'access', label: 'Access' },
  {
    key: 'permissions',
    label: 'Permissions',
    children: sharedLinkPermissionFields,
  },
  {
    key: 'one_time_passcode',
    label: 'One Time Passcode',
    children: [{ key: 'mode', label: 'Mode' }],
  },
];

const llmParamsFields: OutputSchema['fields'] = [
  { key: 'temperature', label: 'Temperature', format: 'number' },
  { key: 'top_p', label: 'Top P', format: 'number' },
  { key: 'frequency_penalty', label: 'Frequency Penalty' },
  { key: 'presence_penalty', label: 'Presence Penalty' },
  { key: 'stop', label: 'Stop' },
  { key: 'type', label: 'Type' },
];

const llmParamsTopKFields: OutputSchema['fields'] = [
  ...llmParamsFields,
  { key: 'top_k', label: 'Top K', format: 'number' },
];

const aiAgentLlmConfigFields: OutputSchema['fields'] = [
  { key: 'model', label: 'Model' },
  { key: 'system_message', label: 'System Message' },
  { key: 'prompt_template', label: 'Prompt Template' },
  {
    key: 'num_tokens_for_completion',
    label: 'Max Completion Tokens',
    format: 'number',
  },
  {
    key: 'llm_endpoint_params',
    label: 'LLM Parameters',
    children: llmParamsTopKFields,
  },
];

const aiAgentEmbeddingsFields: OutputSchema['fields'] = [
  { key: 'model', label: 'Model' },
  {
    key: 'strategy',
    label: 'Strategy',
    children: [
      { key: 'id', label: 'Strategy ID' },
      {
        key: 'num_tokens_per_chunk',
        label: 'Tokens Per Chunk',
        format: 'number',
      },
    ],
  },
];

const aiAgentMultiConfigFields: OutputSchema['fields'] = [
  { key: 'model', label: 'Model' },
  { key: 'system_message', label: 'System Message' },
  { key: 'prompt_template', label: 'Prompt Template' },
  {
    key: 'num_tokens_for_completion',
    label: 'Max Completion Tokens',
    format: 'number',
  },
  {
    key: 'llm_endpoint_params',
    label: 'LLM Parameters',
    children: llmParamsFields,
  },
];

const activeUserRefFields: OutputSchema['fields'] = [
  ...userRefFields,
  { key: 'is_active', label: 'Active', format: 'boolean' },
];

const collaborationFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Collaboration ID' },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'status', label: 'Status' },
  {
    key: 'accessible_by',
    label: 'Accessible By',
    children: activeUserRefFields,
  },
  { key: 'invite_email', label: 'Invite Email', format: 'email' },
  { key: 'role', label: 'Role' },
  { key: 'acknowledged_at', label: 'Acknowledged At', format: 'datetime' },
  { key: 'item', label: 'Item', children: folderRefFields },
  { key: 'is_access_only', label: 'Access Only', format: 'boolean' },
  { key: 'app_item', label: 'App Item' },
];

const collectionFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'collection_type', label: 'Collection Type' },
  { key: 'id', label: 'Collection ID' },
];

const fileVersionFields: OutputSchema['fields'] = [
  ...fileVersionRefFields,
  { key: 'name', label: 'Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  { key: 'modified_by', label: 'Modified By', children: userRefFields },
  { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
  { key: 'purged_at', label: 'Purged At', format: 'datetime' },
];

const metadataTaxonomyFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'id', label: 'Taxonomy ID' },
  { key: 'key', label: 'Key' },
  {
    key: 'levels',
    label: 'Levels',
    labelKey: 'displayName',
    listItems: taxonomyLevelFields,
  },
];

const taskAssignmentCollectionFields: OutputSchema['fields'] = [
  { key: 'total_count', label: 'Total Count', format: 'number' },
  {
    key: 'entries',
    label: 'Assignments',
    labelKey: 'id',
    listItems: [
      { key: 'message', label: 'Message' },
      { key: 'status', label: 'Status' },
      { key: 'type', label: 'Type' },
      { key: 'id', label: 'Assignment ID' },
      { key: 'item', label: 'Item', children: fileRefFields },
      { key: 'assigned_to', label: 'Assigned To', children: userRefFields },
      { key: 'assigned_at', label: 'Assigned At', format: 'datetime' },
      { key: 'resolution_state', label: 'Resolution State' },
    ],
  },
];

const offsetPageFields: OutputSchema['fields'] = [
  { key: 'offset', label: 'Offset', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'total_count', label: 'Total Count', format: 'number' },
  {
    key: 'entries',
    label: 'Memberships',
    labelKey: 'id',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'id', label: 'Membership ID' },
      { key: 'user', label: 'User', children: userRefFields },
      { key: 'group', label: 'Group', children: groupRefFields },
      { key: 'role', label: 'Role' },
    ],
  },
];

const markerPageFields: OutputSchema['fields'] = [
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'next_marker', label: 'Next Marker' },
  { key: 'prev_marker', label: 'Previous Marker' },
  { key: 'entries', label: 'Templates' },
];

const sharedLinkItemFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Item ID' },
  { key: 'etag', label: 'ETag' },
  { key: 'shared_link', label: 'Shared Link', children: sharedLinkFields },
];

const webhookEventFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'Webhook Event ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'trigger', label: 'Trigger' },
  { key: 'webhook', label: 'Webhook', children: objectRefFields },
  { key: 'created_by', label: 'Created By', children: userRefFields },
  { key: 'additional_info', label: 'Additional Info' },
];

export const boxAddUserToGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'User ID' },
    { key: 'user', label: 'User', children: userRefFields },
    { key: 'group', label: 'Group', children: groupRefFields },
    { key: 'role', label: 'Role' },
    { key: 'configurable_permissions', label: 'Configurable Permissions' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  ],
};

export const boxAiAskOutputSchema: OutputSchema = {
  fields: [
    { key: 'answer', label: 'Answer' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completion_reason', label: 'Completion Reason' },
    {
      key: 'ai_agent_info',
      label: 'AI Agent Info',
      children: aiAgentInfoFields,
    },
    {
      key: 'citations',
      label: 'Citations',
      labelKey: 'name',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Citation ID' },
        { key: 'name', label: 'Name' },
        { key: 'content', label: 'Content' },
      ],
    },
  ],
};

export const boxAiExtractOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ai_agent_info',
      label: 'AI Agent Info',
      children: aiAgentInfoFields,
    },
    { key: 'answer', label: 'Answer' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completion_reason', label: 'Completion Reason' },
  ],
};

export const boxAiExtractStructuredOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'answer',
      label: 'Answer',
      children: [{ key: 'summary', label: 'Summary' }],
    },
    {
      key: 'ai_agent_info',
      label: 'AI Agent Info',
      children: aiAgentInfoFields,
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completion_reason', label: 'Completion Reason' },
    {
      key: 'confidence_score',
      label: 'Confidence Score',
      children: [
        {
          key: 'summary',
          label: 'Summary',
          children: [
            { key: 'level', label: 'Level' },
            { key: 'score', label: 'Score', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const boxAppendMetadataTaxonomyLevelOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Items',
      labelKey: 'displayName',
      listItems: taxonomyLevelFields,
    },
  ],
};

export const boxApplyFileWatermarkOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'watermark',
      label: 'Watermark',
      children: [
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'modified_at', label: 'Modified At', format: 'datetime' },
      ],
    },
  ],
};

export const boxApplyMetadataCascadePolicyOutputSchema: OutputSchema = {
  fields: [
    { key: 'started', label: 'Started', format: 'boolean' },
    { key: 'metadataCascadePolicyId', label: 'Metadata Cascade Policy ID' },
    { key: 'conflictResolution', label: 'Conflict Resolution' },
  ],
};

export const boxAssignTaskOutputSchema: OutputSchema = {
  fields: taskAssignmentFields,
};

export const boxCancelSignRequestOutputSchema: OutputSchema = {
  fields: signRequestFields,
};

export const boxCopyFileOutputSchema: OutputSchema = { fields: fileFields };

export const boxCopyFolderOutputSchema: OutputSchema = {
  fields: [
    ...folderFields,
    {
      key: 'item_collection',
      label: 'Item Collection',
      children: [
        { key: 'total_count', label: 'Total Count', format: 'number' },
        { key: 'entries', label: 'Items' },
        { key: 'offset', label: 'Offset', format: 'number' },
        { key: 'limit', label: 'Limit', format: 'number' },
        { key: 'order', label: 'Sort Order', listItems: sortOrderFields },
      ],
    },
  ],
};

export const boxCreateCollaborationOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Collaboration ID' },
    { key: 'created_by', label: 'Created By', children: userRefFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    {
      key: 'accessible_by',
      label: 'Accessible By',
      children: collaboratorFields,
    },
    { key: 'invite_email', label: 'Invite Email', format: 'email' },
    { key: 'role', label: 'Role' },
    { key: 'acknowledged_at', label: 'Acknowledged At', format: 'datetime' },
    { key: 'item', label: 'Item', children: fileRefFields },
    { key: 'is_access_only', label: 'Access Only', format: 'boolean' },
  ],
};

export const boxCreateCommentOutputSchema: OutputSchema = {
  fields: commentFields,
};

export const boxCreateEmailAliasOutputSchema: OutputSchema = {
  fields: emailAliasFields,
};

export const boxCreateFileMetadataOutputSchema: OutputSchema = {
  fields: metadataInstanceFields,
};

export const boxCreateFileSkillCardsOutputSchema: OutputSchema = {
  fields: [
    { key: '$id', label: 'Metadata Instance ID' },
    { key: '$type', label: 'Type Key' },
    { key: '$template', label: 'Template Key' },
    { key: '$parent', label: 'Parent' },
    { key: '$scope', label: 'Scope' },
    { key: '$typeVersion', label: 'Template Version', format: 'number' },
    { key: '$version', label: 'Instance Version', format: 'number' },
    {
      key: 'cards',
      label: 'Cards',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'skill', label: 'Skill', children: objectRefFields },
        { key: 'invocation', label: 'Invocation', children: objectRefFields },
        {
          key: 'entries',
          label: 'Items',
          listItems: [{ key: 'text', label: 'Text' }],
        },
        { key: 'skill_card_type', label: 'Skill Card Type' },
        {
          key: 'skill_card_title',
          label: 'Skill Card Title',
          children: [{ key: 'message', label: 'Message' }],
        },
      ],
    },
    { key: '$canEdit', label: 'Can Edit', format: 'boolean' },
  ],
};

export const boxCreateFolderLockOutputSchema: OutputSchema = {
  fields: folderLockFields,
};

export const boxCreateFolderMetadataOutputSchema: OutputSchema = {
  fields: metadataInstanceFields,
};

export const boxCreateGroupOutputSchema: OutputSchema = {
  fields: [
    ...groupRefFields,
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  ],
};

export const boxCreateMetadataCascadePolicyOutputSchema: OutputSchema = {
  fields: metadataCascadePolicyFields,
};

export const boxCreateMetadataTaxonomyNodeOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Metadata Taxonomy Node ID' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'level', label: 'Level', format: 'number' },
  ],
};

export const boxCreateMetadataTaxonomyOutputSchema: OutputSchema = {
  fields: [
    { key: 'displayName', label: 'Display Name' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'id', label: 'Metadata Taxonomy ID' },
    { key: 'key', label: 'Key' },
    { key: 'levels', label: 'Levels' },
  ],
};

export const boxCreateMetadataTemplateOutputSchema: OutputSchema = {
  fields: metadataTemplateFields,
};

export const boxCreateTaskOutputSchema: OutputSchema = { fields: taskFields };

export const boxCreateUserOutputSchema: OutputSchema = { fields: userFields };

export const boxCreateWebLinkOutputSchema: OutputSchema = {
  fields: webLinkFields,
};

export const boxCreateZipDownloadOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Zip Download ID' },
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'status_url', label: 'Status URL', format: 'url' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
    { key: 'name_conflicts', label: 'Name Conflicts' },
  ],
};

export const boxDeleteCollaborationOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'collaborationId', label: 'Collaboration ID' },
  ],
};

export const boxDeleteCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'commentId', label: 'Comment ID' },
  ],
};

export const boxDeleteEmailAliasOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'userId', label: 'User ID' },
    { key: 'emailAliasId', label: 'Email Alias ID' },
  ],
};

export const boxDeleteFileMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'fileId', label: 'File ID' },
    { key: 'scope', label: 'Scope' },
    { key: 'templateKey', label: 'Template Key' },
  ],
};

export const boxDeleteFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'trashed', label: 'Trashed', format: 'boolean' },
    { key: 'fileId', label: 'File ID' },
  ],
};

export const boxDeleteFilePermanentlyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'fileId', label: 'File ID' },
  ],
};

export const boxDeleteFileVersionOutputSchema: OutputSchema = {
  fields: [
    { key: 'trashed', label: 'Trashed', format: 'boolean' },
    { key: 'fileId', label: 'File ID' },
    { key: 'fileVersionId', label: 'File Version ID' },
  ],
};

export const boxDeleteFolderLockOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'folderLockId', label: 'Folder Lock ID' },
  ],
};

export const boxDeleteFolderMetadataOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
    { key: 'scope', label: 'Scope' },
    { key: 'templateKey', label: 'Template Key' },
  ],
};

export const boxDeleteFolderOutputSchema: OutputSchema = {
  fields: [
    { key: 'trashed', label: 'Trashed', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
  ],
};

export const boxDeleteFolderPermanentlyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
  ],
};

export const boxDeleteGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'groupId', label: 'Group ID' },
  ],
};

export const boxDeleteMetadataCascadePolicyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'metadataCascadePolicyId', label: 'Metadata Cascade Policy ID' },
  ],
};

export const boxDeleteMetadataTaxonomyNodeOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'taxonomyKey', label: 'Taxonomy Key' },
    { key: 'nodeId', label: 'Node ID' },
  ],
};

export const boxDeleteMetadataTaxonomyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'namespace', label: 'Namespace' },
    { key: 'taxonomyKey', label: 'Taxonomy Key' },
  ],
};

export const boxDeleteMetadataTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'scope', label: 'Scope' },
    { key: 'templateKey', label: 'Template Key' },
  ],
};

export const boxDeleteTaskAssignmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'taskAssignmentId', label: 'Task Assignment ID' },
  ],
};

export const boxDeleteTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'taskId', label: 'Task ID' },
  ],
};

export const boxDeleteUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'userId', label: 'User ID' },
  ],
};

export const boxDeleteWebLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'trashed', label: 'Trashed', format: 'boolean' },
    { key: 'webLinkId', label: 'Web Link ID' },
  ],
};

export const boxDeleteWebLinkPermanentlyOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'webLinkId', label: 'Web Link ID' },
  ],
};

export const boxDownloadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const boxFindMetadataTemplateByInstanceOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Items',
      labelKey: 'displayName',
      listItems: metadataTemplateFields,
    },
  ],
};

export const boxFindSharedItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Shared Item ID' },
    {
      key: 'file_version',
      label: 'File Version',
      children: fileVersionRefFields,
    },
    { key: 'sequence_id', label: 'Sequence ID' },
    { key: 'etag', label: 'ETag' },
    { key: 'sha1', label: 'SHA-1 Hash' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'path_collection', label: 'Path', children: pathCollectionFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
    { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
    { key: 'purged_at', label: 'Purged At', format: 'datetime' },
    {
      key: 'content_created_at',
      label: 'Content Created At',
      format: 'datetime',
    },
    {
      key: 'content_modified_at',
      label: 'Content Modified At',
      format: 'datetime',
    },
    { key: 'created_by', label: 'Created By', children: userRefFields },
    { key: 'modified_by', label: 'Modified By', children: userRefFields },
    { key: 'owned_by', label: 'Owner', children: userRefFields },
    { key: 'shared_link', label: 'Shared Link', children: sharedLinkFields },
    { key: 'parent', label: 'Parent Folder', children: folderRefFields },
    { key: 'item_status', label: 'Item Status' },
    { key: 'folder_upload_email', label: 'Folder Upload Email' },
  ],
};

export const boxGetAiAgentDefaultConfigOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'basic_text',
      label: 'Basic Text',
      children: aiAgentLlmConfigFields,
    },
    {
      key: 'long_text',
      label: 'Long Text',
      children: [
        ...aiAgentLlmConfigFields,
        {
          key: 'embeddings',
          label: 'Embeddings',
          children: aiAgentEmbeddingsFields,
        },
      ],
    },
    {
      key: 'basic_image',
      label: 'Basic Image',
      children: aiAgentLlmConfigFields,
    },
    { key: 'type', label: 'Type' },
    {
      key: 'spreadsheet',
      label: 'Spreadsheet',
      children: [
        { key: 'model', label: 'Model' },
        {
          key: 'num_tokens_for_completion',
          label: 'Max Completion Tokens',
          format: 'number',
        },
        {
          key: 'llm_endpoint_params',
          label: 'LLM Parameters',
          children: llmParamsFields,
        },
      ],
    },
    {
      key: 'basic_text_multi',
      label: 'Basic Text Multi',
      children: aiAgentMultiConfigFields,
    },
    {
      key: 'long_text_multi',
      label: 'Long Text Multi',
      children: [
        ...aiAgentMultiConfigFields,
        {
          key: 'embeddings',
          label: 'Embeddings',
          children: aiAgentEmbeddingsFields,
        },
      ],
    },
    {
      key: 'basic_image_multi',
      label: 'Basic Image Multi',
      children: aiAgentMultiConfigFields,
    },
  ],
};

export const boxGetCollaborationOutputSchema: OutputSchema = {
  fields: collaborationFields,
};

export const boxGetCollectionOutputSchema: OutputSchema = {
  fields: collectionFields,
};

export const boxGetFileOutputSchema: OutputSchema = {
  fields: [...fileFields, { key: 'tags', label: 'Tags' }],
};

export const boxGetFileVersionOutputSchema: OutputSchema = {
  fields: fileVersionFields,
};

export const boxGetGroupMembershipOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Group Membership ID' },
    { key: 'user', label: 'User', children: userRefFields },
    { key: 'group', label: 'Group', children: groupRefFields },
    { key: 'role', label: 'Role' },
    {
      key: 'configurable_permissions',
      label: 'Configurable Permissions',
      children: [
        {
          key: 'can_create_accounts',
          label: 'Can Create Accounts',
          format: 'boolean',
        },
        {
          key: 'can_edit_accounts',
          label: 'Can Edit Accounts',
          format: 'boolean',
        },
        {
          key: 'can_instant_login',
          label: 'Can Instant Login',
          format: 'boolean',
        },
        { key: 'can_run_reports', label: 'Can Run Reports', format: 'boolean' },
      ],
    },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
  ],
};

export const boxGetGroupOutputSchema: OutputSchema = {
  fields: [
    ...groupRefFields,
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
    { key: 'description', label: 'Description' },
  ],
};

export const boxGetMetadataTaxonomyOutputSchema: OutputSchema = {
  fields: metadataTaxonomyFields,
};

export const boxGetTaskAssignmentOutputSchema: OutputSchema = {
  fields: taskAssignmentFields,
};

export const boxGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'item', label: 'Item', children: fileRefFields },
    { key: 'id', label: 'Task ID' },
    { key: 'type', label: 'Type' },
    { key: 'due_at', label: 'Due At', format: 'datetime' },
    { key: 'action', label: 'Action' },
    { key: 'message', label: 'Message' },
    {
      key: 'task_assignment_collection',
      label: 'Task Assignment Collection',
      children: taskAssignmentCollectionFields,
    },
    { key: 'is_completed', label: 'Completed', format: 'boolean' },
    { key: 'created_by', label: 'Created By', children: userRefFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completion_rule', label: 'Completion Rule' },
  ],
};

export const boxGetTrashedFileOutputSchema: OutputSchema = {
  fields: fileFields,
};

export const boxGetTrashedFolderOutputSchema: OutputSchema = {
  fields: folderFields,
};

export const boxGetTrashedWebLinkOutputSchema: OutputSchema = {
  fields: webLinkFields,
};

export const boxGetWebLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Web Link ID' },
    { key: 'sequence_id', label: 'Sequence ID' },
    { key: 'etag', label: 'ETag' },
    { key: 'name', label: 'Name' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'created_by', label: 'Created By', children: userRefFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
    { key: 'parent', label: 'Parent Folder', children: folderRefFields },
    { key: 'description', label: 'Description' },
    { key: 'item_status', label: 'Item Status' },
    { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
    { key: 'purged_at', label: 'Purged At', format: 'datetime' },
    { key: 'shared_link', label: 'Shared Link', children: sharedLinkFields },
    { key: 'path_collection', label: 'Path', children: pathCollectionFields },
    { key: 'modified_by', label: 'Modified By', children: userRefFields },
    { key: 'owned_by', label: 'Owner', children: userRefFields },
  ],
};

export const boxGetZipDownloadStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_file_count', label: 'Total File Count', format: 'number' },
    {
      key: 'downloaded_file_count',
      label: 'Downloaded File Count',
      format: 'number',
    },
    {
      key: 'skipped_file_count',
      label: 'Skipped File Count',
      format: 'number',
    },
    {
      key: 'skipped_folder_count',
      label: 'Skipped Folder Count',
      format: 'number',
    },
    { key: 'state', label: 'State' },
  ],
};

export const boxListCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'entries', label: 'Items' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const boxListCollectionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    {
      key: 'entries',
      label: 'Collections',
      labelKey: 'name',
      listItems: collectionFields,
    },
  ],
};

export const boxListDevicePinsOutputSchema: OutputSchema = {
  fields: [
    { key: 'entries', label: 'Device Pins' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'order', label: 'Sort Order', listItems: sortOrderFields },
  ],
};

export const boxListEmailAliasesOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Email Aliases',
      labelKey: 'email',
      listItems: emailAliasFields,
    },
  ],
};

export const boxListEnterpriseMetadataTemplatesOutputSchema: OutputSchema = {
  fields: [
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'prev_marker', label: 'Previous Marker' },
    {
      key: 'entries',
      label: 'Enterprise Metadata Templates',
      labelKey: 'displayName',
      listItems: metadataTemplateFields,
    },
  ],
};

export const boxListEventsOutputSchema: OutputSchema = {
  fields: [
    { key: 'chunk_size', label: 'Chunk Size', format: 'number' },
    { key: 'next_stream_position', label: 'Next Stream Position' },
    {
      key: 'entries',
      label: 'Events',
      listItems: [
        {
          key: 'source',
          label: 'Source',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'id', label: 'Source ID' },
            { key: 'name', label: 'Name' },
            { key: 'login', label: 'Login Email', format: 'email' },
            { key: 'item_type', label: 'Item Type' },
            { key: 'item_id', label: 'Item ID' },
            { key: 'item_name', label: 'Item Name' },
            {
              key: 'parent',
              label: 'Parent Folder',
              children: folderRefFields,
            },
            { key: 'owned_by', label: 'Owner', children: userRefFields },
            {
              key: 'file_version',
              label: 'File Version',
              children: fileVersionRefFields,
            },
            { key: 'sequence_id', label: 'Sequence ID' },
            { key: 'etag', label: 'ETag' },
            { key: 'sha1', label: 'SHA-1 Hash' },
            { key: 'description', label: 'Description' },
            { key: 'size', label: 'Size', format: 'filesize' },
            {
              key: 'path_collection',
              label: 'Path',
              children: pathCollectionFields,
            },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'modified_at', label: 'Modified At', format: 'datetime' },
            { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
            { key: 'purged_at', label: 'Purged At', format: 'datetime' },
            {
              key: 'content_created_at',
              label: 'Content Created At',
              format: 'datetime',
            },
            {
              key: 'content_modified_at',
              label: 'Content Modified At',
              format: 'datetime',
            },
            { key: 'created_by', label: 'Created By', children: userRefFields },
            {
              key: 'modified_by',
              label: 'Modified By',
              children: userRefFields,
            },
            { key: 'shared_link', label: 'Shared Link' },
            { key: 'item_status', label: 'Item Status' },
            { key: 'is_package', label: 'Package', format: 'boolean' },
            { key: 'synced', label: 'Synced', format: 'boolean' },
            { key: 'folder_upload_email', label: 'Folder Upload Email' },
            {
              key: 'is_reply_comment',
              label: 'Reply Comment',
              format: 'boolean',
            },
            { key: 'message', label: 'Message' },
            { key: 'item', label: 'Item', children: objectRefFields },
            { key: 'url', label: 'URL', format: 'url' },
          ],
        },
        { key: 'created_by', label: 'Created By', children: userRefFields },
        { key: 'action_by', label: 'Action By' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'event_id', label: 'Event ID' },
        { key: 'event_type', label: 'Event Type' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'type', label: 'Type' },
        { key: 'session_id', label: 'Session ID' },
        {
          key: 'additional_details',
          label: 'Additional Details',
          children: [
            { key: 'service_id', label: 'Service ID' },
            { key: 'service_name', label: 'Service Name' },
            { key: 'size', label: 'Size', format: 'filesize' },
            { key: 'ekm_id', label: 'EKM ID' },
            { key: 'version_id', label: 'Version ID' },
            { key: 'original_item_type', label: 'Original Item Type' },
            { key: 'original_item_id', label: 'Original Item ID' },
            { key: 'original_item_name', label: 'Original Item Name' },
            { key: 'comment_id', label: 'Comment ID' },
            { key: 'message', label: 'Message' },
            {
              key: 'task',
              label: 'Task',
              children: [
                { key: 'id', label: 'Task ID' },
                { key: 'message', label: 'Message' },
                {
                  key: 'created_by',
                  label: 'Created By',
                  children: [
                    { key: 'id', label: 'Creator ID' },
                    { key: 'login', label: 'Login Email', format: 'email' },
                  ],
                },
              ],
            },
            { key: 'shared_link_id', label: 'Shared Link ID' },
            {
              key: 'sharedLinkSettings',
              label: 'Shared Link Settings',
              children: [
                { key: 'newVisibilityStatus', label: 'Visibility' },
                {
                  key: 'newIsPasswordProtected',
                  label: 'Password Protected',
                  format: 'boolean',
                },
                {
                  key: 'newCanPreview',
                  label: 'Can Preview',
                  format: 'boolean',
                },
                { key: 'newCanEdit', label: 'Can Edit', format: 'boolean' },
                {
                  key: 'newCanDownload',
                  label: 'Can Download',
                  format: 'boolean',
                },
                {
                  key: 'newIsExpirationDateSet',
                  label: 'Expiration Date Set',
                  format: 'boolean',
                },
              ],
            },
          ],
        },
        { key: 'recorded_at', label: 'Recorded At', format: 'datetime' },
      ],
    },
  ],
};

export const boxListFileAppItemAssociationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'entries', label: 'App Item Associations' },
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'previous_marker', label: 'Previous Marker' },
    { key: 'limit', label: 'Limit', format: 'number' },
  ],
};

export const boxListFileCollaborationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'previous_marker', label: 'Previous Marker' },
    {
      key: 'entries',
      label: 'Collaborations',
      labelKey: 'id',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Collaboration ID' },
        { key: 'created_by', label: 'Created By', children: userRefFields },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'modified_at', label: 'Modified At', format: 'datetime' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
        { key: 'status', label: 'Status' },
        {
          key: 'accessible_by',
          label: 'Accessible By',
          children: collaboratorFields,
        },
        { key: 'invite_email', label: 'Invite Email', format: 'email' },
        { key: 'role', label: 'Role' },
        {
          key: 'acknowledged_at',
          label: 'Acknowledged At',
          format: 'datetime',
        },
        { key: 'item', label: 'Item', children: fileRefFields },
        { key: 'is_access_only', label: 'Access Only', format: 'boolean' },
        { key: 'app_item', label: 'App Item' },
      ],
    },
  ],
};

export const boxListFileCommentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    {
      key: 'entries',
      label: 'Comments',
      labelKey: 'id',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Comment ID' },
        { key: 'is_reply_comment', label: 'Reply Comment', format: 'boolean' },
        { key: 'message', label: 'Message' },
        { key: 'created_by', label: 'Created By', children: userRefFields },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
  ],
};

export const boxListFileMetadataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Metadata',
      listItems: metadataInstanceFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
  ],
};

export const boxListFileTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'entries', label: 'Tasks', labelKey: 'id', listItems: taskFields },
  ],
};

export const boxListFileVersionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Versions',
      labelKey: 'name',
      listItems: fileVersionFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const boxListFolderCollaborationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Collaborations',
      labelKey: 'id',
      listItems: collaborationFields,
    },
  ],
};

export const boxListFolderItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Items',
      labelKey: 'name',
      listItems: fileRefFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'order', label: 'Sort Order', listItems: sortOrderFields },
  ],
};

export const boxListFolderLocksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Locks',
      labelKey: 'id',
      listItems: folderLockFields,
    },
    { key: 'limit', label: 'Limit' },
  ],
};

export const boxListFolderMetadataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Metadata',
      listItems: metadataInstanceFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
  ],
};

export const boxListGlobalMetadataTemplatesOutputSchema: OutputSchema = {
  fields: [
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'prev_marker', label: 'Previous Marker' },
    {
      key: 'entries',
      label: 'Global Metadata Templates',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'Global Metadata Template ID' },
        { key: 'type', label: 'Type' },
        { key: 'templateKey', label: 'Template Key' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'hidden', label: 'Hidden', format: 'boolean' },
        {
          key: 'copyInstanceOnItemCopy',
          label: 'Copy Instance On Item Copy',
          format: 'boolean',
        },
        {
          key: 'fields',
          label: 'Fields',
          labelKey: 'displayName',
          listItems: [
            { key: 'id', label: 'Field ID' },
            { key: 'type', label: 'Type' },
            { key: 'key', label: 'Key' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'hidden', label: 'Hidden', format: 'boolean' },
            {
              key: 'options',
              label: 'Options',
              labelKey: 'key',
              listItems: [
                { key: 'id', label: 'Option ID' },
                { key: 'key', label: 'Key' },
              ],
            },
            { key: 'description', label: 'Description' },
          ],
        },
        { key: 'scope', label: 'Scope' },
      ],
    },
  ],
};

export const boxListGroupCollaborationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Collaborations',
      labelKey: 'id',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Collaboration ID' },
        { key: 'created_by', label: 'Created By' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'modified_at', label: 'Modified At', format: 'datetime' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
        { key: 'status', label: 'Status' },
        {
          key: 'accessible_by',
          label: 'Accessible By',
          children: groupRefFields,
        },
        { key: 'invite_email', label: 'Invite Email', format: 'email' },
        { key: 'role', label: 'Role' },
        {
          key: 'acknowledged_at',
          label: 'Acknowledged At',
          format: 'datetime',
        },
        { key: 'item', label: 'Item', children: fileRefFields },
        { key: 'is_access_only', label: 'Access Only', format: 'boolean' },
        { key: 'app_item', label: 'App Item' },
      ],
    },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
  ],
};

export const boxListGroupMembershipsOutputSchema: OutputSchema = {
  fields: offsetPageFields,
};

export const boxListGroupsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Groups',
      labelKey: 'name',
      listItems: groupRefFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const boxListMetadataCascadePoliciesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Metadata Cascade Policies',
      labelKey: 'id',
      listItems: metadataCascadePolicyFields,
    },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'prev_marker', label: 'Previous Marker' },
  ],
};

export const boxListMetadataTaxonomiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
    {
      key: 'entries',
      label: 'Metadata Taxonomies',
      labelKey: 'displayName',
      listItems: metadataTaxonomyFields,
    },
  ],
};

export const boxListMetadataTaxonomyNodesOutputSchema: OutputSchema = {
  fields: [
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
    {
      key: 'entries',
      label: 'Metadata Taxonomy Nodes',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'Metadata Taxonomy Node ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'deprecated', label: 'Deprecated', format: 'boolean' },
        { key: 'nodePath', label: 'Node Path' },
        { key: 'ancestors', label: 'Ancestors' },
      ],
    },
    {
      key: 'total_result_count',
      label: 'Total Result Count',
      format: 'number',
    },
  ],
};

export const boxListMetadataTemplateFieldOptionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'limit', label: 'Limit', format: 'number' },
    {
      key: 'entries',
      label: 'Metadata Template Field Options',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'Metadata Template Field Option ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'level', label: 'Level', format: 'number' },
        { key: 'deprecated', label: 'Deprecated', format: 'boolean' },
        { key: 'selectable', label: 'Selectable', format: 'boolean' },
        { key: 'nodePath', label: 'Node Path' },
        { key: 'ancestors', label: 'Ancestors' },
      ],
    },
    {
      key: 'total_result_count',
      label: 'Total Result Count',
      format: 'number',
    },
  ],
};

export const boxListRecentItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'order', label: 'Sort Order', children: sortOrderFields },
    {
      key: 'entries',
      label: 'Recent Items',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'interaction_type', label: 'Interaction Type' },
        { key: 'interacted_at', label: 'Interacted At', format: 'datetime' },
        { key: 'item', label: 'Item', children: fileRefFields },
        { key: 'interaction_shared_link', label: 'Interaction Shared Link' },
      ],
    },
  ],
};

export const boxListSignRequestsOutputSchema: OutputSchema = {
  fields: [
    { key: 'next_marker', label: 'Next Marker' },
    { key: 'limit', label: 'Limit', format: 'number' },
    {
      key: 'entries',
      label: 'Sign Requests',
      labelKey: 'name',
      listItems: signRequestFields,
    },
  ],
};

export const boxListSignTemplatesOutputSchema: OutputSchema = {
  fields: markerPageFields,
};

export const boxListSlackIntegrationMappingsOutputSchema: OutputSchema = {
  fields: [{ key: 'entries', label: 'Slack Integration Mappings' }],
};

export const boxListTaskAssignmentsOutputSchema: OutputSchema = {
  fields: taskAssignmentCollectionFields,
};

export const boxListTrashedItemsOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Trashed Items',
      labelKey: 'name',
      listItems: fileRefFields,
    },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'order', label: 'Sort Order', listItems: sortOrderFields },
  ],
};

export const boxListUserMembershipsOutputSchema: OutputSchema = {
  fields: offsetPageFields,
};

export const boxListUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'entries', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'next_marker', label: 'Next Marker' },
  ],
};

export const boxListWorkflowsOutputSchema: OutputSchema = {
  fields: markerPageFields,
};

export const boxQueryMetadataOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'entries',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'etag', label: 'ETag' },
        { key: 'id', label: 'Item ID' },
        { key: 'type', label: 'Type' },
      ],
    },
    { key: 'limit', label: 'Limit', format: 'number' },
  ],
};

export const boxRemoveFileSharedLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'File ID' },
    { key: 'etag', label: 'ETag' },
    { key: 'shared_link', label: 'Shared Link' },
  ],
};

export const boxRemoveFileWatermarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'fileId', label: 'File ID' },
  ],
};

export const boxRemoveFolderWatermarkOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'folderId', label: 'Folder ID' },
  ],
};

export const boxRemoveUserFromGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'groupMembershipId', label: 'Group Membership ID' },
  ],
};

export const boxRestoreFolderOutputSchema: OutputSchema = {
  fields: folderFields,
};

export const boxSearchOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    {
      key: 'entries',
      label: 'Items',
      labelKey: 'name',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Item ID' },
        { key: 'etag', label: 'ETag' },
        { key: 'sequence_id', label: 'Sequence ID' },
        { key: 'name', label: 'Name' },
        { key: 'sha1', label: 'SHA-1 Hash' },
        {
          key: 'file_version',
          label: 'File Version',
          children: fileVersionRefFields,
        },
        { key: 'description', label: 'Description' },
        { key: 'size', label: 'Size', format: 'filesize' },
        {
          key: 'path_collection',
          label: 'Path',
          children: pathCollectionFields,
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'modified_at', label: 'Modified At', format: 'datetime' },
        { key: 'trashed_at', label: 'Trashed At', format: 'datetime' },
        { key: 'purged_at', label: 'Purged At', format: 'datetime' },
        {
          key: 'content_created_at',
          label: 'Content Created At',
          format: 'datetime',
        },
        {
          key: 'content_modified_at',
          label: 'Content Modified At',
          format: 'datetime',
        },
        { key: 'created_by', label: 'Created By', children: userRefFields },
        { key: 'modified_by', label: 'Modified By', children: userRefFields },
        { key: 'owned_by', label: 'Owner', children: userRefFields },
        {
          key: 'shared_link',
          label: 'Shared Link',
          children: [
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'effective_access', label: 'Effective Access' },
            { key: 'effective_permission', label: 'Effective Permission' },
            {
              key: 'is_password_enabled',
              label: 'Password Protected',
              format: 'boolean',
            },
            {
              key: 'download_count',
              label: 'Download Count',
              format: 'number',
            },
            { key: 'preview_count', label: 'Preview Count', format: 'number' },
            { key: 'download_url', label: 'Download URL', format: 'url' },
            { key: 'vanity_url', label: 'Vanity URL' },
            { key: 'vanity_name', label: 'Vanity Name' },
            { key: 'access', label: 'Access' },
            { key: 'unshared_at', label: 'Unshared At', format: 'datetime' },
            {
              key: 'permissions',
              label: 'Permissions',
              children: sharedLinkPermissionFields,
            },
          ],
        },
        { key: 'parent', label: 'Parent Folder', children: folderRefFields },
        { key: 'item_status', label: 'Item Status' },
        { key: 'folder_upload_email', label: 'Folder Upload Email' },
        { key: 'url', label: 'URL', format: 'url' },
      ],
    },
    { key: 'type', label: 'Type' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ],
};

export const boxSetFileSharedLinkOutputSchema: OutputSchema = {
  fields: sharedLinkItemFields,
};

export const boxSetFolderSharedLinkOutputSchema: OutputSchema = {
  fields: sharedLinkItemFields,
};

export const boxSetUserAvatarOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'pic_urls',
      label: 'Profile Picture URLs',
      children: [
        { key: 'small', label: 'Small', format: 'image' },
        { key: 'large', label: 'Large', format: 'image' },
        { key: 'preview', label: 'Preview', format: 'image' },
      ],
    },
  ],
};

export const boxTerminateGroupSessionsOutputSchema: OutputSchema = {
  fields: [{ key: 'message', label: 'Message' }],
};

export const boxUpdateCollaborationOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Collaboration ID' },
    { key: 'created_by', label: 'Created By', children: userRefFields },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'modified_at', label: 'Modified At', format: 'datetime' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    {
      key: 'accessible_by',
      label: 'Accessible By',
      children: activeUserRefFields,
    },
    { key: 'invite_email', label: 'Invite Email', format: 'email' },
    { key: 'role', label: 'Role' },
    { key: 'acknowledged_at', label: 'Acknowledged At', format: 'datetime' },
    { key: 'item', label: 'Item', children: folderRefFields },
    { key: 'is_access_only', label: 'Access Only', format: 'boolean' },
  ],
};

export const boxUpdateGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    { key: 'id', label: 'Group ID' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
  ],
};

export const boxUpdateMetadataTaxonomyLevelOutputSchema: OutputSchema = {
  fields: taxonomyLevelFields,
};

export const boxUpdateTaskOutputSchema: OutputSchema = { fields: taskFields };

export const boxUploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'entries', label: 'Items', labelKey: 'name', listItems: fileFields },
  ],
};

export const newCommentOutputSchema: OutputSchema = {
  fields: [
    ...webhookEventFields,
    { key: 'source', label: 'Source', children: commentFields },
  ],
};

export const newFileOutputSchema: OutputSchema = {
  fields: [
    ...webhookEventFields,
    { key: 'source', label: 'Source', children: fileFields },
  ],
};

export const newFolderOutputSchema: OutputSchema = {
  fields: [
    ...webhookEventFields,
    { key: 'source', label: 'Source', children: folderFields },
  ],
};
