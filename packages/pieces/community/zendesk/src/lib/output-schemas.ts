import { OutputSchema } from '@activepieces/pieces-framework';

const attachmentFields: OutputSchema['fields'] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'file_name', label: 'File Name' },
  { key: 'content_url', label: 'Content URL', format: 'url' },
  { key: 'mapped_content_url', label: 'Mapped Content URL', format: 'url' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'width', label: 'Width' },
  { key: 'height', label: 'Height' },
  { key: 'inline', label: 'Inline', format: 'boolean' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
  { key: 'malware_access_override', label: 'Malware Access Override', format: 'boolean' },
  { key: 'malware_scan_result', label: 'Malware Scan Result' },
  { key: 'thumbnails', label: 'Thumbnails' },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'iana_time_zone', label: 'Iana Time Zone' },
  { key: 'phone', label: 'Phone' },
  { key: 'shared_phone_number', label: 'Shared Phone Number' },
  { key: 'photo', label: 'Photo' },
  { key: 'locale_id', label: 'Locale ID', format: 'number' },
  { key: 'locale', label: 'Locale' },
  { key: 'organization_id', label: 'Organization ID', format: 'number' },
  { key: 'role', label: 'Role' },
  { key: 'verified', label: 'Verified', format: 'boolean' },
  { key: 'external_id', label: 'External ID' },
  { key: 'tags', label: 'Tags' },
  { key: 'alias', label: 'Alias' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'shared', label: 'Shared', format: 'boolean' },
  { key: 'shared_agent', label: 'Shared Agent', format: 'boolean' },
  { key: 'last_login_at', label: 'Last Login At', format: 'datetime' },
  { key: 'two_factor_auth_enabled', label: 'Two Factor Auth Enabled' },
  { key: 'signature', label: 'Signature' },
  { key: 'details', label: 'Details' },
  { key: 'notes', label: 'Notes' },
  { key: 'role_type', label: 'Role Type', format: 'number' },
  { key: 'custom_role_id', label: 'Custom Role ID', format: 'number' },
  { key: 'is_billing_admin', label: 'Is Billing Admin', format: 'boolean' },
  { key: 'moderator', label: 'Moderator', format: 'boolean' },
  { key: 'ticket_restriction', label: 'Ticket Restriction' },
  { key: 'only_private_comments', label: 'Only Private Comments', format: 'boolean' },
  { key: 'restricted_agent', label: 'Restricted Agent', format: 'boolean' },
  { key: 'suspended', label: 'Suspended', format: 'boolean' },
  { key: 'default_group_id', label: 'Default Group ID', format: 'number' },
  { key: 'report_csv', label: 'Report CSV', format: 'boolean' },
  { key: 'user_fields', label: 'User Fields' },
  { key: 'suspension_details', label: 'Suspension Details' },
];

const organizationFields: OutputSchema['fields'] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'shared_tickets', label: 'Shared Tickets', format: 'boolean' },
  { key: 'shared_comments', label: 'Shared Comments', format: 'boolean' },
  { key: 'ticket_restriction', label: 'Ticket Restriction' },
  { key: 'external_id', label: 'External ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'domain_names', label: 'Domain Names' },
  { key: 'details', label: 'Details' },
  { key: 'notes', label: 'Notes' },
  { key: 'group_id', label: 'Group ID' },
  { key: 'tags', label: 'Tags' },
  { key: 'organization_fields', label: 'Organization Fields' },
  { key: 'children_count', label: 'Children Count', format: 'number' },
];

const ticketFields: OutputSchema['fields'] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'external_id', label: 'External ID' },
  {
    key: 'via',
    label: 'Via',
    children: [
      { key: 'channel', label: 'Channel' },
      {
        key: 'source',
        label: 'Source',
        children: [
          { key: 'from', label: 'From' },
          { key: 'to', label: 'To' },
          { key: 'rel', label: 'Rel' },
        ],
      },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'type', label: 'Type' },
  { key: 'subject', label: 'Subject' },
  { key: 'raw_subject', label: 'Raw Subject (with placeholders)' },
  { key: 'description', label: 'Description' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'recipient', label: 'Recipient' },
  { key: 'requester_id', label: 'Requester ID', format: 'number' },
  { key: 'submitter_id', label: 'Submitter ID', format: 'number' },
  { key: 'assignee_id', label: 'Assignee ID', format: 'number' },
  { key: 'organization_id', label: 'Organization ID', format: 'number' },
  { key: 'group_id', label: 'Group ID', format: 'number' },
  { key: 'collaborator_ids', label: 'Collaborator IDs' },
  { key: 'follower_ids', label: 'Follower IDs' },
  { key: 'email_cc_ids', label: 'Email CC IDs' },
  { key: 'forum_topic_id', label: 'Forum Topic ID' },
  { key: 'problem_id', label: 'Problem ID' },
  { key: 'has_incidents', label: 'Has Incidents', format: 'boolean' },
  { key: 'is_public', label: 'Is Public', format: 'boolean' },
  { key: 'due_at', label: 'Due At', format: 'datetime' },
  { key: 'tags', label: 'Tags' },
  {
    key: 'custom_fields',
    label: 'Custom Fields',
    labelKey: 'id',
    listItems: [
      { key: 'id', label: 'ID', format: 'number' },
      { key: 'value', label: 'Value' },
    ],
  },
  {
    key: 'satisfaction_rating',
    label: 'Satisfaction Rating',
    children: [
      { key: 'score', label: 'Score' },
    ],
  },
  { key: 'sharing_agreement_ids', label: 'Sharing Agreement IDs' },
  { key: 'custom_status_id', label: 'Custom Status ID', format: 'number' },
  { key: 'followup_ids', label: 'Followup IDs' },
  { key: 'ticket_form_id', label: 'Ticket Form ID', format: 'number' },
  { key: 'brand_id', label: 'Brand ID', format: 'number' },
  { key: 'allow_channelback', label: 'Allow Channelback', format: 'boolean' },
  { key: 'allow_attachments', label: 'Allow Attachments', format: 'boolean' },
  { key: 'from_messaging_channel', label: 'From Messaging Channel', format: 'boolean' },
  { key: 'support_type', label: 'Support Type' },
];

export const zendeskAddTicketCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'ticket', label: 'Ticket', children: ticketFields },
    {
      key: 'audit',
      label: 'Audit',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'author_id', label: 'Author ID', format: 'number' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            {
              key: 'system',
              label: 'System',
              children: [
                { key: 'client', label: 'Client' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'transaction_id', label: 'Transaction ID' },
                { key: 'location', label: 'Location' },
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
              ],
            },
            { key: 'custom', label: 'Custom' },
          ],
        },
        {
          key: 'events',
          label: 'Events',
          labelKey: 'subject',
          listItems: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'type', label: 'Type' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            { key: 'body', label: 'Body' },
            { key: 'html_body', label: 'HTML Body' },
            { key: 'plain_body', label: 'Plain Body' },
            { key: 'public', label: 'Public', format: 'boolean' },
            { key: 'attachments', label: 'Attachments' },
            { key: 'audit_id', label: 'Audit ID', format: 'number' },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
            { key: 'subject', label: 'Subject' },
            { key: 'recipients', label: 'Recipients' },
          ],
        },
        {
          key: 'via',
          label: 'Via',
          children: [
            { key: 'channel', label: 'Channel' },
            {
              key: 'source',
              label: 'Source',
              children: [
                { key: 'from', label: 'From' },
                {
                  key: 'to',
                  label: 'To',
                  children: [
                    { key: 'address', label: 'Address', format: 'email' },
                    { key: 'name', label: 'Name' },
                    { key: 'email_ccs', label: 'Email Ccs' },
                  ],
                },
                { key: 'rel', label: 'Rel' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const zendeskAddOrganizationTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskCreateTicketOutputSchema: OutputSchema = { fields: ticketFields };

export const zendeskDeleteTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
  ],
};

export const attachFileToTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'ticket', label: 'Ticket', children: ticketFields },
        {
          key: 'audit',
          label: 'Audit',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            {
              key: 'metadata',
              label: 'Metadata',
              children: [
                {
                  key: 'system',
                  label: 'System',
                  children: [
                    { key: 'client', label: 'Client' },
                    { key: 'ip_address', label: 'IP Address' },
                    { key: 'transaction_id', label: 'Transaction ID' },
                    { key: 'location', label: 'Location' },
                    { key: 'latitude', label: 'Latitude', format: 'number' },
                    { key: 'longitude', label: 'Longitude', format: 'number' },
                  ],
                },
                { key: 'custom', label: 'Custom' },
              ],
            },
            {
              key: 'events',
              label: 'Events',
              labelKey: 'subject',
              listItems: [
                { key: 'id', label: 'ID', format: 'number' },
                { key: 'type', label: 'Type' },
                {
                  key: 'via',
                  label: 'Via',
                  children: [
                    { key: 'channel', label: 'Channel' },
                    { key: 'source', label: 'Source' },
                  ],
                },
                { key: 'subject', label: 'Subject' },
                { key: 'body', label: 'Body' },
                { key: 'recipients', label: 'Recipients' },
                { key: 'author_id', label: 'Author ID', format: 'number' },
                { key: 'html_body', label: 'HTML Body' },
                { key: 'plain_body', label: 'Plain Body' },
                { key: 'public', label: 'Public', format: 'boolean' },
                { key: 'attachments', label: 'Attachments', labelKey: 'id', listItems: attachmentFields },
                { key: 'audit_id', label: 'Audit ID', format: 'number' },
              ],
            },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    { key: 'file_name', label: 'File Name' },
    { key: 'upload_token', label: 'Upload Token' },
  ],
};

export const zendeskGetTicketConversationLogOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'events',
      label: 'Events',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'reference', label: 'Reference' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'author',
          label: 'Author',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'zen:support:user_id', label: 'Zen Support User ID', format: 'number' },
            { key: 'display_name', label: 'Display Name' },
          ],
        },
        {
          key: 'content',
          label: 'Content',
          children: [
            { key: 'type', label: 'Type' },
            { key: 'body', label: 'Body' },
          ],
        },
        { key: 'type', label: 'Type' },
        { key: 'attachments', label: 'Attachments' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            {
              key: 'system',
              label: 'System',
              children: [
                { key: 'client', label: 'Client' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'transaction_id', label: 'Transaction ID' },
                { key: 'location', label: 'Location' },
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
                { key: 'email_id', label: 'Email ID' },
              ],
            },
            { key: 'custom', label: 'Custom' },
            { key: 'is_public', label: 'Is Public', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskCountSearchResultsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskCountViewTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'view_id', label: 'View ID', format: 'number' },
    { key: 'value', label: 'Value', format: 'number' },
    { key: 'pretty', label: 'Pretty' },
    { key: 'fresh', label: 'Fresh', format: 'boolean' },
  ],
};

export const zendeskCreateManyTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'job_type', label: 'Job Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    { key: 'results', label: 'Results' },
  ],
};

export const zendeskDeleteOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'organization_id', label: 'Organization ID', format: 'number' },
  ],
};

export const zendeskDeleteCustomObjectRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'custom_object_key', label: 'Custom Object Key' },
    { key: 'record_id', label: 'Record ID' },
  ],
};

export const zendeskDeleteUserOutputSchema: OutputSchema = { fields: userFields };

export const zendeskDeleteUserIdentityOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'identity_id', label: 'Identity ID', format: 'number' },
  ],
};

export const zendeskDeleteOrganizationMembershipOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'organization_membership_id', label: 'Organization Membership ID', format: 'number' },
  ],
};

export const zendeskGetAttachmentOutputSchema: OutputSchema = { fields: attachmentFields };

export const zendeskGetAutomationOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'default', label: 'Default', format: 'boolean' },
    {
      key: 'actions',
      label: 'Actions',
      listItems: [
        { key: 'field', label: 'Field' },
        { key: 'value', label: 'Value' },
      ],
    },
    {
      key: 'conditions',
      label: 'Conditions',
      children: [
        {
          key: 'all',
          label: 'All',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'operator', label: 'Operator' },
            { key: 'value', label: 'Value' },
          ],
        },
        { key: 'any', label: 'Any' },
      ],
    },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'raw_title', label: 'Raw Title' },
  ],
};

export const zendeskGetMacroOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'description', label: 'Description' },
    {
      key: 'actions',
      label: 'Actions',
      listItems: [
        { key: 'field', label: 'Field' },
        { key: 'value', label: 'Value' },
      ],
    },
    { key: 'restriction', label: 'Restriction' },
    { key: 'raw_title', label: 'Raw Title' },
  ],
};

export const zendeskGetManyTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskGetManyUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskGetOrganizationOutputSchema: OutputSchema = { fields: organizationFields };

export const zendeskGetCustomObjectRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'custom_object_key', label: 'Custom Object Key' },
    { key: 'custom_object_fields', label: 'Custom Object Fields' },
    { key: 'created_by_user_id', label: 'Created By User ID' },
    { key: 'updated_by_user_id', label: 'Updated By User ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'external_id', label: 'External ID' },
    { key: 'photo', label: 'Photo' },
  ],
};

export const zendeskGetTicketTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'title', label: 'Title' },
    { key: 'active', label: 'Active', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'default', label: 'Default', format: 'boolean' },
    {
      key: 'actions',
      label: 'Actions',
      listItems: [
        { key: 'field', label: 'Field' },
        { key: 'value', label: 'Value' },
      ],
    },
    {
      key: 'conditions',
      label: 'Conditions',
      children: [
        {
          key: 'all',
          label: 'All',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'operator', label: 'Operator' },
            { key: 'value', label: 'Value', format: 'boolean' },
          ],
        },
        { key: 'any', label: 'Any' },
      ],
    },
    { key: 'description', label: 'Description' },
    { key: 'position', label: 'Position', format: 'number' },
    { key: 'raw_title', label: 'Raw Title' },
    { key: 'category_id', label: 'Category ID' },
  ],
};

export const zendeskGetUserOutputSchema: OutputSchema = { fields: userFields };

export const zendeskCreateUserIdentityOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'value', label: 'Value', format: 'email' },
    { key: 'verified', label: 'Verified', format: 'boolean' },
    { key: 'primary', label: 'Primary', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'verification_method', label: 'Verification Method' },
    { key: 'verified_at', label: 'Verified At' },
    { key: 'undeliverable_count', label: 'Undeliverable Count', format: 'number' },
    { key: 'deliverable_state', label: 'Deliverable State' },
  ],
};

export const zendeskGetJobStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'job_type', label: 'Job Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'progress', label: 'Progress', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'id',
      listItems: [
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'account_id', label: 'Account ID', format: 'number' },
      ],
    },
  ],
};

export const zendeskListTicketAuditsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'audits',
      label: 'Audits',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'author_id', label: 'Author ID', format: 'number' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            {
              key: 'system',
              label: 'System',
              children: [
                { key: 'client', label: 'Client' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'transaction_id', label: 'Transaction ID' },
                { key: 'location', label: 'Location' },
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
                { key: 'email_id', label: 'Email ID' },
              ],
            },
            { key: 'custom', label: 'Custom' },
          ],
        },
        {
          key: 'events',
          label: 'Events',
          labelKey: 'subject',
          listItems: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'type', label: 'Type' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            { key: 'body', label: 'Body' },
            { key: 'html_body', label: 'HTML Body' },
            { key: 'plain_body', label: 'Plain Body' },
            { key: 'public', label: 'Public', format: 'boolean' },
            { key: 'attachments', label: 'Attachments' },
            { key: 'audit_id', label: 'Audit ID', format: 'number' },
            { key: 'value', label: 'Value' },
            { key: 'field_name', label: 'Field Name' },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
            { key: 'subject', label: 'Subject' },
            { key: 'recipients', label: 'Recipients' },
            { key: 'previous_value', label: 'Previous Value' },
            { key: 'comment_id', label: 'Comment ID' },
          ],
        },
        {
          key: 'via',
          label: 'Via',
          children: [
            { key: 'channel', label: 'Channel' },
            {
              key: 'source',
              label: 'Source',
              children: [
                { key: 'from', label: 'From' },
                {
                  key: 'to',
                  label: 'To',
                  children: [
                    { key: 'address', label: 'Address', format: 'email' },
                    { key: 'name', label: 'Name' },
                    { key: 'email_ccs', label: 'Email Ccs' },
                  ],
                },
                { key: 'rel', label: 'Rel' },
              ],
            },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListAutomationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'automations',
      label: 'Automations',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        {
          key: 'conditions',
          label: 'Conditions',
          children: [
            {
              key: 'all',
              label: 'All',
              listItems: [
                { key: 'field', label: 'Field' },
                { key: 'operator', label: 'Operator' },
                { key: 'value', label: 'Value' },
              ],
            },
            { key: 'any', label: 'Any' },
          ],
        },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'raw_title', label: 'Raw Title' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListBrandsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'brands',
      label: 'Brands',
      labelKey: 'name',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'brand_url', label: 'Brand URL', format: 'url' },
        { key: 'subdomain', label: 'Subdomain' },
        { key: 'host_mapping', label: 'Host Mapping' },
        { key: 'has_help_center', label: 'Has Help Center', format: 'boolean' },
        { key: 'help_center_state', label: 'Help Center State' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'is_deleted', label: 'Is Deleted', format: 'boolean' },
        { key: 'logo', label: 'Logo' },
        { key: 'ticket_form_ids', label: 'Ticket Form IDs' },
        { key: 'signature_template', label: 'Signature Template' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketEmailCcsOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListCustomObjectFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_object_fields',
      label: 'Custom Object Fields',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'key', label: 'Key' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'raw_title', label: 'Raw Title' },
        { key: 'raw_description', label: 'Raw Description' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'system', label: 'System', format: 'boolean' },
        { key: 'regexp_for_validation', label: 'Regexp For Validation' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'required', label: 'Required', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListCustomObjectRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_object_records',
      label: 'Custom Object Records',
      labelKey: 'name',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'custom_object_key', label: 'Custom Object Key' },
        { key: 'custom_object_fields', label: 'Custom Object Fields' },
        { key: 'created_by_user_id', label: 'Created By User ID' },
        { key: 'updated_by_user_id', label: 'Updated By User ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'external_id', label: 'External ID' },
        { key: 'photo', label: 'Photo' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'author_id', label: 'Author ID', format: 'number' },
        { key: 'body', label: 'Body' },
        { key: 'html_body', label: 'HTML Body' },
        { key: 'plain_body', label: 'Plain Body' },
        { key: 'public', label: 'Public', format: 'boolean' },
        { key: 'attachments', label: 'Attachments', labelKey: 'id', listItems: attachmentFields },
        { key: 'audit_id', label: 'Audit ID', format: 'number' },
        {
          key: 'via',
          label: 'Via',
          children: [
            { key: 'channel', label: 'Channel' },
            {
              key: 'source',
              label: 'Source',
              children: [
                { key: 'from', label: 'From' },
                {
                  key: 'to',
                  label: 'To',
                  children: [
                    { key: 'address', label: 'Address', format: 'email' },
                    { key: 'name', label: 'Name' },
                    { key: 'email_ccs', label: 'Email Ccs' },
                  ],
                },
                { key: 'rel', label: 'Rel' },
              ],
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            {
              key: 'system',
              label: 'System',
              children: [
                { key: 'client', label: 'Client' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'transaction_id', label: 'Transaction ID' },
                { key: 'location', label: 'Location' },
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
              ],
            },
            { key: 'custom', label: 'Custom' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_page', label: 'Next Page' },
  ],
};

export const zendeskListCustomObjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_objects',
      label: 'Custom Objects',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'key', label: 'Key' },
        { key: 'created_by_user_id', label: 'Created By User ID' },
        { key: 'updated_by_user_id', label: 'Updated By User ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'title', label: 'Title' },
        { key: 'raw_title', label: 'Raw Title' },
        { key: 'title_pluralized', label: 'Title Pluralized' },
        { key: 'raw_title_pluralized', label: 'Raw Title Pluralized' },
        { key: 'description', label: 'Description' },
        { key: 'raw_description', label: 'Raw Description' },
        { key: 'include_in_list_view', label: 'Include In List View', format: 'boolean' },
        { key: 'allows_photos', label: 'Allows Photos', format: 'boolean' },
        { key: 'created_via', label: 'Created Via' },
        { key: 'allows_attachments', label: 'Allows Attachments', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListCustomStatusesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_statuses',
      label: 'Custom Statuses',
      labelKey: 'id',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'status_category', label: 'Status Category' },
        { key: 'agent_label', label: 'Agent Label' },
        { key: 'raw_agent_label', label: 'Raw Agent Label' },
        { key: 'end_user_label', label: 'End User Label' },
        { key: 'raw_end_user_label', label: 'Raw End User Label' },
        { key: 'description', label: 'Description' },
        { key: 'raw_description', label: 'Raw Description' },
        { key: 'end_user_description', label: 'End User Description' },
        { key: 'raw_end_user_description', label: 'Raw End User Description' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListDeletedTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted_tickets',
      label: 'Deleted Tickets',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'subject', label: 'Subject' },
        { key: 'description', label: 'Description' },
        {
          key: 'actor',
          label: 'Actor',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
        { key: 'previous_state', label: 'Previous State' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_public', label: 'Is Public', format: 'boolean' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'deleted', label: 'Deleted', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListUserIdentitiesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'identities',
      label: 'Identities',
      labelKey: 'id',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'value', label: 'Value', format: 'email' },
        { key: 'verified', label: 'Verified', format: 'boolean' },
        { key: 'primary', label: 'Primary', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'verification_method', label: 'Verification Method' },
        { key: 'verified_at', label: 'Verified At' },
        { key: 'undeliverable_count', label: 'Undeliverable Count', format: 'number' },
        { key: 'deliverable_state', label: 'Deliverable State' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketIncidentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListMacrosOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'macros',
      label: 'Macros',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'description', label: 'Description' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        { key: 'restriction', label: 'Restriction' },
        { key: 'raw_title', label: 'Raw Title' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListOrganizationMembershipsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'organization_memberships',
      label: 'Organization Memberships',
      labelKey: 'id',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'organization_id', label: 'Organization ID', format: 'number' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'organization_name', label: 'Organization Name' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'view_tickets', label: 'View Tickets', format: 'boolean' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListOrganizationUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListOrganizationFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'organization_fields', label: 'Organization Fields' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListOrganizationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'organizations', label: 'Organizations', labelKey: 'name', listItems: organizationFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListProblemTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListSatisfactionRatingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'satisfaction_ratings', label: 'Satisfaction Ratings' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListSlaPoliciesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sla_policies',
      label: 'Sla Policies',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'position', label: 'Position', format: 'number' },
        {
          key: 'filter',
          label: 'Filter',
          children: [
            { key: 'all', label: 'All' },
            { key: 'any', label: 'Any' },
          ],
        },
        {
          key: 'policy_metrics',
          label: 'Policy Metrics',
          listItems: [
            { key: 'priority', label: 'Priority' },
            { key: 'metric', label: 'Metric' },
            { key: 'target', label: 'Target', format: 'number' },
            { key: 'business_hours', label: 'Business Hours', format: 'boolean' },
            { key: 'target_in_seconds', label: 'Target In Seconds', format: 'number' },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'metric_settings', label: 'Metric Settings' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListSuspendedTicketsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'suspended_tickets',
      label: 'Suspended Tickets',
      labelKey: 'subject',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        {
          key: 'author',
          label: 'Author',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
        { key: 'subject', label: 'Subject' },
        { key: 'content', label: 'Content' },
        { key: 'cause', label: 'Cause' },
        { key: 'cause_id', label: 'Cause ID', format: 'number' },
        { key: 'error_messages', label: 'Error Messages' },
        { key: 'message_id', label: 'Message ID', format: 'email' },
        { key: 'ticket_id', label: 'Ticket ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        {
          key: 'via',
          label: 'Via',
          children: [
            { key: 'channel', label: 'Channel' },
            {
              key: 'source',
              label: 'Source',
              children: [
                {
                  key: 'from',
                  label: 'From',
                  children: [
                    { key: 'address', label: 'Address', format: 'email' },
                    { key: 'name', label: 'Name' },
                  ],
                },
                {
                  key: 'to',
                  label: 'To',
                  children: [
                    { key: 'name', label: 'Name' },
                    { key: 'address', label: 'Address', format: 'email' },
                  ],
                },
                { key: 'rel', label: 'Rel' },
              ],
            },
          ],
        },
        { key: 'attachments', label: 'Attachments' },
        { key: 'recipient', label: 'Recipient', format: 'email' },
        { key: 'brand_id', label: 'Brand ID', format: 'number' },
        { key: 'content_html', label: 'Content HTML' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ticket_fields',
      label: 'Ticket Fields',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'title', label: 'Title' },
        { key: 'raw_title', label: 'Raw Title' },
        { key: 'description', label: 'Description' },
        { key: 'raw_description', label: 'Raw Description' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'collapsed_for_agents', label: 'Collapsed For Agents', format: 'boolean' },
        { key: 'regexp_for_validation', label: 'Regexp For Validation' },
        { key: 'title_in_portal', label: 'Title In Portal' },
        { key: 'raw_title_in_portal', label: 'Raw Title In Portal' },
        { key: 'visible_in_portal', label: 'Visible In Portal', format: 'boolean' },
        { key: 'editable_in_portal', label: 'Editable In Portal', format: 'boolean' },
        { key: 'required_in_portal', label: 'Required In Portal', format: 'boolean' },
        { key: 'agent_can_edit', label: 'Agent Can Edit', format: 'boolean' },
        { key: 'tag', label: 'Tag' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'removable', label: 'Removable', format: 'boolean' },
        { key: 'key', label: 'Key' },
        { key: 'agent_description', label: 'Agent Description' },
        { key: 'raw_agent_description', label: 'Raw Agent Description' },
        {
          key: 'system_field_options',
          label: 'System Field Options',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'value', label: 'Value' },
          ],
        },
        { key: 'sub_type_id', label: 'Sub Type ID', format: 'number' },
        {
          key: 'custom_field_options',
          label: 'Custom Field Options',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'name', label: 'Name' },
            { key: 'raw_name', label: 'Raw Name' },
            { key: 'value', label: 'Value' },
            { key: 'default', label: 'Default', format: 'boolean' },
            { key: 'allow_solving', label: 'Allow Solving', format: 'boolean' },
          ],
        },
        {
          key: 'custom_statuses',
          label: 'Custom Statuses',
          labelKey: 'id',
          listItems: [
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'status_category', label: 'Status Category' },
            { key: 'agent_label', label: 'Agent Label' },
            { key: 'end_user_label', label: 'End User Label' },
            { key: 'description', label: 'Description' },
            { key: 'end_user_description', label: 'End User Description' },
            { key: 'active', label: 'Active', format: 'boolean' },
            { key: 'default', label: 'Default', format: 'boolean' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'updated_at', label: 'Updated At', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ticket_forms',
      label: 'Ticket Forms',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'raw_name', label: 'Raw Name' },
        { key: 'raw_display_name', label: 'Raw Display Name' },
        { key: 'end_user_visible', label: 'End User Visible', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'ticket_field_ids', label: 'Ticket Field IDs' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'in_all_brands', label: 'In All Brands', format: 'boolean' },
        { key: 'restricted_brand_ids', label: 'Restricted Brand IDs' },
        { key: 'end_user_conditions', label: 'End User Conditions' },
        { key: 'agent_conditions', label: 'Agent Conditions' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'name', label: 'Name' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'form_type', label: 'Form Type' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'deleted_at', label: 'Deleted At' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskListTicketTriggersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'triggers',
      label: 'Triggers',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        {
          key: 'conditions',
          label: 'Conditions',
          children: [
            {
              key: 'all',
              label: 'All',
              listItems: [
                { key: 'field', label: 'Field' },
                { key: 'operator', label: 'Operator' },
                { key: 'value', label: 'Value', format: 'boolean' },
              ],
            },
            { key: 'any', label: 'Any' },
          ],
        },
        { key: 'description', label: 'Description' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'raw_title', label: 'Raw Title' },
        { key: 'category_id', label: 'Category ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListUserFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'user_fields', label: 'User Fields' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskListViewsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'views',
      label: 'Views',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'description', label: 'Description' },
        {
          key: 'execution',
          label: 'Execution',
          children: [
            { key: 'group_by', label: 'Group By' },
            { key: 'group_order', label: 'Group Order' },
            { key: 'sort_by', label: 'Sort By' },
            { key: 'sort_order', label: 'Sort Order' },
            {
              key: 'group',
              label: 'Group',
              children: [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'filterable', label: 'Filterable', format: 'boolean' },
                { key: 'sortable', label: 'Sortable', format: 'boolean' },
                { key: 'order', label: 'Order' },
              ],
            },
            {
              key: 'sort',
              label: 'Sort',
              children: [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'filterable', label: 'Filterable', format: 'boolean' },
                { key: 'sortable', label: 'Sortable', format: 'boolean' },
                { key: 'order', label: 'Order' },
              ],
            },
            {
              key: 'columns',
              label: 'Columns',
              labelKey: 'title',
              listItems: [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'filterable', label: 'Filterable', format: 'boolean' },
                { key: 'sortable', label: 'Sortable', format: 'boolean' },
              ],
            },
            {
              key: 'fields',
              label: 'Fields',
              labelKey: 'title',
              listItems: [
                { key: 'id', label: 'ID' },
                { key: 'title', label: 'Title' },
                { key: 'filterable', label: 'Filterable', format: 'boolean' },
                { key: 'sortable', label: 'Sortable', format: 'boolean' },
              ],
            },
            { key: 'custom_fields', label: 'Custom Fields' },
          ],
        },
        {
          key: 'conditions',
          label: 'Conditions',
          children: [
            {
              key: 'all',
              label: 'All',
              listItems: [
                { key: 'field', label: 'Field' },
                { key: 'operator', label: 'Operator' },
                { key: 'value', label: 'Value' },
              ],
            },
            { key: 'any', label: 'Any' },
          ],
        },
        { key: 'restriction', label: 'Restriction' },
        { key: 'raw_title', label: 'Raw Title' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskMakeUserIdentityPrimaryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'identities',
      label: 'Identities',
      labelKey: 'id',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'user_id', label: 'User ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'value', label: 'Value', format: 'email' },
        { key: 'verified', label: 'Verified', format: 'boolean' },
        { key: 'primary', label: 'Primary', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'verification_method', label: 'Verification Method' },
        { key: 'verified_at', label: 'Verified At' },
        { key: 'undeliverable_count', label: 'Undeliverable Count', format: 'number' },
        { key: 'deliverable_state', label: 'Deliverable State' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskMakeCommentPrivateOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
    { key: 'comment_id', label: 'Comment ID', format: 'number' },
  ],
};

export const zendeskGetCurrentUserOutputSchema: OutputSchema = { fields: userFields };

export const zendeskCreateOrganizationMembershipOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'organization_id', label: 'Organization ID', format: 'number' },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'organization_name', label: 'Organization Name' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'view_tickets', label: 'View Tickets', format: 'boolean' },
  ],
};

export const zendeskMergeTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'job_type', label: 'Job Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'total', label: 'Total' },
    { key: 'progress', label: 'Progress' },
    { key: 'status', label: 'Status' },
    { key: 'message', label: 'Message' },
    { key: 'results', label: 'Results' },
  ],
};

export const zendeskCreateOrUpdateOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'boolean' },
    { key: 'organization', label: 'Organization', children: organizationFields },
  ],
};

export const zendeskPreviewMacroOnTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'ticket', label: 'Ticket', children: ticketFields },
  ],
};

export const zendeskRecoverSuspendedTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskRedactCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'author_id', label: 'Author ID', format: 'number' },
    { key: 'body', label: 'Body' },
    { key: 'html_body', label: 'HTML Body' },
    { key: 'plain_body', label: 'Plain Body' },
    { key: 'public', label: 'Public', format: 'boolean' },
    { key: 'attachments', label: 'Attachments' },
    { key: 'audit_id', label: 'Audit ID', format: 'number' },
  ],
};

export const zendeskSearchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'result_type',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'result_type', label: 'Result Type' },
        { key: 'url', label: 'API URL', format: 'url' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_page', label: 'Next Page', format: 'number' },
  ],
};

export const zendeskSearchAutomationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'automations',
      label: 'Automations',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        {
          key: 'conditions',
          label: 'Conditions',
          children: [
            {
              key: 'all',
              label: 'All',
              listItems: [
                { key: 'field', label: 'Field' },
                { key: 'operator', label: 'Operator' },
                { key: 'value', label: 'Value' },
              ],
            },
            { key: 'any', label: 'Any' },
          ],
        },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'raw_title', label: 'Raw Title' },
        {
          key: 'highlights',
          label: 'Highlights',
          children: [
            { key: 'title', label: 'Title' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskSearchMacrosOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'macros',
      label: 'Macros',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'description', label: 'Description' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        { key: 'restriction', label: 'Restriction' },
        { key: 'raw_title', label: 'Raw Title' },
        {
          key: 'highlights',
          label: 'Highlights',
          children: [
            { key: 'title', label: 'Title' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_page', label: 'Next Page' },
  ],
};

export const zendeskSearchOrganizationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'organizations', label: 'Organizations', labelKey: 'name', listItems: organizationFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskSearchTicketTriggersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'triggers',
      label: 'Triggers',
      labelKey: 'title',
      listItems: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active', format: 'boolean' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'default', label: 'Default', format: 'boolean' },
        {
          key: 'actions',
          label: 'Actions',
          listItems: [
            { key: 'field', label: 'Field' },
            { key: 'value', label: 'Value' },
          ],
        },
        {
          key: 'conditions',
          label: 'Conditions',
          children: [
            {
              key: 'all',
              label: 'All',
              listItems: [
                { key: 'field', label: 'Field' },
                { key: 'operator', label: 'Operator' },
                { key: 'value', label: 'Value', format: 'boolean' },
              ],
            },
            { key: 'any', label: 'Any' },
          ],
        },
        { key: 'description', label: 'Description' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'raw_title', label: 'Raw Title' },
        {
          key: 'highlights',
          label: 'Highlights',
          children: [
            { key: 'title', label: 'Title' },
          ],
        },
        { key: 'category_id', label: 'Category ID' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const zendeskSearchUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_page', label: 'Next Page' },
  ],
};

export const zendeskGetTicketSlaMetricsOutputSchema: OutputSchema = {
  fields: [
    { key: 'policy_metrics', label: 'Policy Metrics' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const newGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'is_public', label: 'Is Public', format: 'boolean' },
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'default', label: 'Default', format: 'boolean' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const newOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'external_id', label: 'External ID' },
    { key: 'group_id', label: 'Group ID' },
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'shared_comments', label: 'Shared Comments', format: 'boolean' },
    { key: 'shared_tickets', label: 'Shared Tickets', format: 'boolean' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const newUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'default_group_id', label: 'Default Group ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'external_id', label: 'External ID' },
    { key: 'id', label: 'ID' },
    { key: 'organization_id', label: 'Organization ID' },
    { key: 'role', label: 'Role' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const tagAddedToUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'default_group_id', label: 'Default Group ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'external_id', label: 'External ID' },
    { key: 'id', label: 'ID' },
    { key: 'organization_id', label: 'Organization ID' },
    { key: 'role', label: 'Role' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'added_tags', label: 'Added Tags' },
  ],
};

export const zendeskGetTicketMetricsOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'group_stations', label: 'Group Stations', format: 'number' },
    { key: 'assignee_stations', label: 'Assignee Stations', format: 'number' },
    { key: 'reopens', label: 'Reopens', format: 'number' },
    { key: 'replies', label: 'Replies', format: 'number' },
    { key: 'assignee_updated_at', label: 'Assignee Updated At', format: 'datetime' },
    { key: 'requester_updated_at', label: 'Requester Updated At', format: 'datetime' },
    { key: 'status_updated_at', label: 'Status Updated At', format: 'datetime' },
    { key: 'initially_assigned_at', label: 'Initially Assigned At', format: 'datetime' },
    { key: 'assigned_at', label: 'Assigned At', format: 'datetime' },
    { key: 'solved_at', label: 'Solved At' },
    { key: 'latest_comment_added_at', label: 'Latest Comment Added At', format: 'datetime' },
    {
      key: 'reply_time_in_minutes',
      label: 'Reply Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar', format: 'number' },
        { key: 'business', label: 'Business', format: 'number' },
      ],
    },
    {
      key: 'first_resolution_time_in_minutes',
      label: 'First Resolution Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar' },
        { key: 'business', label: 'Business' },
      ],
    },
    {
      key: 'full_resolution_time_in_minutes',
      label: 'Full Resolution Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar' },
        { key: 'business', label: 'Business' },
      ],
    },
    {
      key: 'agent_wait_time_in_minutes',
      label: 'Agent Wait Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar' },
        { key: 'business', label: 'Business' },
      ],
    },
    {
      key: 'requester_wait_time_in_minutes',
      label: 'Requester Wait Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar' },
        { key: 'business', label: 'Business' },
      ],
    },
    {
      key: 'on_hold_time_in_minutes',
      label: 'On Hold Time In Minutes',
      children: [
        { key: 'calendar', label: 'Calendar', format: 'number' },
        { key: 'business', label: 'Business', format: 'number' },
      ],
    },
    { key: 'custom_status_updated_at', label: 'Custom Status Updated At', format: 'datetime' },
  ],
};

export const zendeskCreateUserOutputSchema: OutputSchema = { fields: userFields };

export const zendeskCreateOrUpdateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'boolean' },
    { key: 'user', label: 'User', children: userFields },
  ],
};

export const zendeskUpsertCustomObjectRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'boolean' },
    {
      key: 'custom_object_record',
      label: 'Custom Object Record',
      children: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'custom_object_key', label: 'Custom Object Key' },
        { key: 'custom_object_fields', label: 'Custom Object Fields' },
        { key: 'created_by_user_id', label: 'Created By User ID' },
        { key: 'updated_by_user_id', label: 'Updated By User ID' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'external_id', label: 'External ID' },
        { key: 'photo', label: 'Photo' },
      ],
    },
  ],
};

export const addCommentToTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'ticket', label: 'Ticket', children: ticketFields },
        {
          key: 'audit',
          label: 'Audit',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            {
              key: 'metadata',
              label: 'Metadata',
              children: [
                {
                  key: 'system',
                  label: 'System',
                  children: [
                    { key: 'client', label: 'Client' },
                    { key: 'ip_address', label: 'IP Address' },
                    { key: 'transaction_id', label: 'Transaction ID' },
                    { key: 'location', label: 'Location' },
                    { key: 'latitude', label: 'Latitude', format: 'number' },
                    { key: 'longitude', label: 'Longitude', format: 'number' },
                  ],
                },
                { key: 'custom', label: 'Custom' },
              ],
            },
            {
              key: 'events',
              label: 'Events',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID', format: 'number' },
                { key: 'type', label: 'Type' },
                { key: 'author_id', label: 'Author ID', format: 'number' },
                { key: 'body', label: 'Body' },
                { key: 'html_body', label: 'HTML Body' },
                { key: 'plain_body', label: 'Plain Body' },
                { key: 'public', label: 'Public', format: 'boolean' },
                { key: 'attachments', label: 'Attachments' },
                { key: 'audit_id', label: 'Audit ID', format: 'number' },
              ],
            },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      key: 'comment_details',
      label: 'Comment Details',
      children: [
        { key: 'is_public', label: 'Is Public', format: 'boolean' },
        { key: 'content_type', label: 'Content Type' },
      ],
    },
  ],
};

export const deleteUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'user', label: 'User', children: userFields },
      ],
    },
    { key: 'warning', label: 'Warning' },
    { key: 'note', label: 'Note' },
  ],
};

export const findAgentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'agent', label: 'Agent', children: userFields },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'role', label: 'Role' },
    { key: 'active', label: 'Active', format: 'boolean' },
  ],
};

export const findGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'group',
      label: 'Group',
      children: [
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'is_public', label: 'Is Public', format: 'boolean' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'default', label: 'Default', format: 'boolean' },
        { key: 'deleted', label: 'Deleted', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'is_public', label: 'Is Public', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const findOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'results', label: 'Results', labelKey: 'name', listItems: organizationFields },
        { key: 'facets', label: 'Facets' },
        { key: 'next_page', label: 'Next Page' },
        { key: 'previous_page', label: 'Previous Page' },
        { key: 'count', label: 'Count', format: 'number' },
      ],
    },
    { key: 'organizations', label: 'Organizations', labelKey: 'name', listItems: organizationFields },
    {
      key: 'search_criteria',
      label: 'Search Criteria',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'query', label: 'Query' },
        { key: 'sort_by', label: 'Sort By' },
        { key: 'sort_order', label: 'Sort Order' },
      ],
    },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'found_count', label: 'Found Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const findTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'results', label: 'Results', labelKey: 'subject', listItems: ticketFields },
        { key: 'facets', label: 'Facets' },
        { key: 'next_page', label: 'Next Page' },
        { key: 'previous_page', label: 'Previous Page' },
        { key: 'count', label: 'Count', format: 'number' },
      ],
    },
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    {
      key: 'search_criteria',
      label: 'Search Criteria',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'query', label: 'Query' },
        { key: 'sort_by', label: 'Sort By' },
        { key: 'sort_order', label: 'Sort Order' },
      ],
    },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'found_count', label: 'Found Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const findUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'results', label: 'Results', labelKey: 'name', listItems: userFields },
        { key: 'facets', label: 'Facets' },
        { key: 'next_page', label: 'Next Page' },
        { key: 'previous_page', label: 'Previous Page' },
        { key: 'count', label: 'Count', format: 'number' },
      ],
    },
    { key: 'users', label: 'Users', labelKey: 'name', listItems: userFields },
    {
      key: 'search_criteria',
      label: 'Search Criteria',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'query', label: 'Query' },
        { key: 'sort_by', label: 'Sort By' },
        { key: 'sort_order', label: 'Sort Order' },
      ],
    },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'found_count', label: 'Found Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const findLatestCommentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'comment',
      label: 'Comment',
      children: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'author_id', label: 'Author ID', format: 'number' },
        { key: 'body', label: 'Body' },
        { key: 'html_body', label: 'HTML Body' },
        { key: 'plain_body', label: 'Plain Body' },
        { key: 'public', label: 'Public', format: 'boolean' },
        { key: 'attachments', label: 'Attachments' },
        { key: 'audit_id', label: 'Audit ID', format: 'number' },
        {
          key: 'via',
          label: 'Via',
          children: [
            { key: 'channel', label: 'Channel' },
            {
              key: 'source',
              label: 'Source',
              children: [
                { key: 'from', label: 'From' },
                { key: 'to', label: 'To' },
                { key: 'rel', label: 'Rel' },
              ],
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'metadata',
          label: 'Metadata',
          children: [
            {
              key: 'system',
              label: 'System',
              children: [
                { key: 'client', label: 'Client' },
                { key: 'ip_address', label: 'IP Address' },
                { key: 'transaction_id', label: 'Transaction ID' },
                { key: 'location', label: 'Location' },
                { key: 'latitude', label: 'Latitude', format: 'number' },
                { key: 'longitude', label: 'Longitude', format: 'number' },
              ],
            },
            { key: 'custom', label: 'Custom' },
          ],
        },
      ],
    },
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'body', label: 'Body' },
    { key: 'html_body', label: 'HTML Body' },
    { key: 'author_id', label: 'Author ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'is_public', label: 'Is Public', format: 'boolean' },
    { key: 'attachments', label: 'Attachments' },
  ],
};

export const createOrganizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'organization', label: 'Organization', children: organizationFields },
      ],
    },
  ],
};

export const createTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'ticket', label: 'Ticket', children: ticketFields },
        {
          key: 'audit',
          label: 'Audit',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            {
              key: 'metadata',
              label: 'Metadata',
              children: [
                {
                  key: 'system',
                  label: 'System',
                  children: [
                    { key: 'client', label: 'Client' },
                    { key: 'ip_address', label: 'IP Address' },
                    { key: 'transaction_id', label: 'Transaction ID' },
                    { key: 'location', label: 'Location' },
                    { key: 'latitude', label: 'Latitude', format: 'number' },
                    { key: 'longitude', label: 'Longitude', format: 'number' },
                  ],
                },
                { key: 'custom', label: 'Custom' },
              ],
            },
            {
              key: 'events',
              label: 'Events',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID', format: 'number' },
                { key: 'type', label: 'Type' },
                { key: 'value', label: 'Value' },
                { key: 'field_name', label: 'Field Name' },
                { key: 'author_id', label: 'Author ID', format: 'number' },
                { key: 'body', label: 'Body' },
                { key: 'html_body', label: 'HTML Body' },
                { key: 'plain_body', label: 'Plain Body' },
                { key: 'public', label: 'Public', format: 'boolean' },
                { key: 'attachments', label: 'Attachments' },
                { key: 'audit_id', label: 'Audit ID', format: 'number' },
              ],
            },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const updateTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'ticket', label: 'Ticket', children: ticketFields },
        {
          key: 'audit',
          label: 'Audit',
          children: [
            { key: 'id', label: 'ID', format: 'number' },
            { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
            { key: 'author_id', label: 'Author ID', format: 'number' },
            {
              key: 'metadata',
              label: 'Metadata',
              children: [
                {
                  key: 'system',
                  label: 'System',
                  children: [
                    { key: 'client', label: 'Client' },
                    { key: 'ip_address', label: 'IP Address' },
                    { key: 'transaction_id', label: 'Transaction ID' },
                    { key: 'location', label: 'Location' },
                    { key: 'latitude', label: 'Latitude', format: 'number' },
                    { key: 'longitude', label: 'Longitude', format: 'number' },
                  ],
                },
                { key: 'custom', label: 'Custom' },
              ],
            },
            {
              key: 'events',
              label: 'Events',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID', format: 'number' },
                { key: 'type', label: 'Type' },
                { key: 'value', label: 'Value' },
                { key: 'field_name', label: 'Field Name' },
                { key: 'previous_value', label: 'Previous Value' },
              ],
            },
            {
              key: 'via',
              label: 'Via',
              children: [
                { key: 'channel', label: 'Channel' },
                {
                  key: 'source',
                  label: 'Source',
                  children: [
                    { key: 'from', label: 'From' },
                    { key: 'to', label: 'To' },
                    { key: 'rel', label: 'Rel' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const addTagToTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'tags', label: 'Tags' },
      ],
    },
    { key: 'added_tags', label: 'Added Tags' },
  ],
};

export const removeTagFromTicketOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'tags', label: 'Tags' },
      ],
    },
    { key: 'removed_tags', label: 'Removed Tags' },
  ],
};

export const createUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'user', label: 'User', children: userFields },
      ],
    },
    { key: 'user_role', label: 'User Role' },
    { key: 'verification_email_sent', label: 'Verification Email Sent', format: 'boolean' },
  ],
};

export const updateUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'user', label: 'User', children: userFields },
      ],
    },
  ],
};

export const zendeskListViewTicketsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tickets', label: 'Tickets', labelKey: 'subject', listItems: ticketFields },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const zendeskGetSatisfactionRatingOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'url', label: 'API URL', format: 'url' },
    { key: 'score', label: 'Score' },
    { key: 'comment', label: 'Comment' },
    { key: 'reason', label: 'Reason' },
    { key: 'reason_code', label: 'Reason Code', format: 'number' },
    { key: 'reason_id', label: 'Reason ID', format: 'number' },
    { key: 'ticket_id', label: 'Ticket ID', format: 'number' },
    { key: 'requester_id', label: 'Requester ID', format: 'number' },
    { key: 'assignee_id', label: 'Assignee ID', format: 'number' },
    { key: 'group_id', label: 'Group ID', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};
