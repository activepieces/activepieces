import { OutputSchema } from '@activepieces/pieces-framework';

const pageFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Items on This Page', format: 'number' },
  { key: 'current', label: 'Page', format: 'number' },
  { key: 'total', label: 'Total Pages', format: 'number' },
];

const documentFields: OutputSchema['fields'] = [
  { key: 'attached_to', label: 'Attached To' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'uuid', label: 'UUID' },
  { key: 'match_master_template', label: 'Match Master Template', format: 'boolean' },
  { key: 'name', label: 'Name' },
  { key: 'ocr_ready_url', label: 'OCR Ready URL', format: 'url' },
  { key: 'original_document_url', label: 'Original Document URL', format: 'url' },
  { key: 'parser', label: 'Mailbox ID', format: 'number' },
  { key: 'processed', label: 'Processed', format: 'datetime' },
  { key: 'received', label: 'Received', format: 'datetime' },
  { key: 'sample_set', label: 'Template Samples' },
  { key: 'status_source', label: 'Status Source' },
  { key: 'status', label: 'Status' },
  { key: 'template', label: 'Template' },
  { key: 'credits_used', label: 'Credits Used', format: 'number' },
  { key: 'conventional_credits_used', label: 'Conventional Credits Used', format: 'number' },
  { key: 'ai_credits_used', label: 'AI Credits Used', format: 'number' },
  { key: 'is_ai_ready', label: 'Is AI Ready', format: 'boolean' },
  {
      key: 'is_identification_text_final',
      label: 'Is Identification Text Final',
      format: 'boolean',
    },
  { key: 'is_ocr_ready', label: 'Is OCR Ready', format: 'boolean' },
  { key: 'is_spreadsheet', label: 'Is Spreadsheet', format: 'boolean' },
  { key: 'progress', label: 'Progress' },
  { key: 'is_processable', label: 'Is Processable', format: 'boolean' },
  { key: 'is_splittable', label: 'Is Splittable', format: 'boolean' },
  { key: 'is_split', label: 'Is Split', format: 'boolean' },
  { key: 'json_download_url', label: 'JSON Download URL', format: 'url' },
  { key: 'csv_download_url', label: 'CSV Download URL', format: 'url' },
  { key: 'xls_download_url', label: 'Excel Download URL', format: 'url' },
];

const parsedDataField: OutputSchema['fields'][number] = {
  key: 'result',
  label: 'Parsed Data (JSON)',
};

const documentDetailFields: OutputSchema['fields'] = [
  ...documentFields,
  parsedDataField,
  { key: 'content', label: 'Content' },
  { key: 'next_id', label: 'Next Document ID', format: 'number' },
  { key: 'prev_id', label: 'Previous Document ID', format: 'number' },
  {
      key: 'ocr_page_set',
      label: 'OCR Page Set',
      listItems: [
        {
          key: 'image',
          label: 'Image',
          children: [
            { key: 'url', label: 'URL', format: 'image' },
            { key: 'width', label: 'Width', format: 'number' },
            { key: 'height', label: 'Height', format: 'number' },
            { key: 'content_type', label: 'Content Type' },
          ],
        },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'included_in_range', label: 'Included In Range', format: 'boolean' },
      ],
    },
];

const mailboxSummaryFields: OutputSchema['fields'] = [
  { key: 'account_uuid', label: 'Account UUID' },
  { key: 'ai_engine', label: 'AI Engine' },
  { key: 'ai_instructions', label: 'AI Instructions' },
  { key: 'attachments_only', label: 'Attachments Only', format: 'boolean' },
  { key: 'attachments_only_override', label: 'Attachments Only Override' },
  { key: 'allowed_extensions', label: 'Allowed Extensions' },
  { key: 'can_transform', label: 'Can Transform', format: 'boolean' },
  { key: 'disable_deskew', label: 'Disable Deskew', format: 'boolean' },
  { key: 'enable_layouted_text', label: 'Enable Layouted Text', format: 'boolean' },
  { key: 'document_count', label: 'Document Count', format: 'number' },
  {
      key: 'document_per_status_count',
      label: 'Document Per Status Count',
      children: [
        { key: 'INCOMING', label: 'INCOMING', format: 'number' },
        { key: 'ANALYZING', label: 'ANALYZING', format: 'number' },
        { key: 'PROGRESS', label: 'PROGRESS', format: 'number' },
        { key: 'PARSEDOK', label: 'PARSEDOK', format: 'number' },
        { key: 'PARSEDKO', label: 'PARSEDKO', format: 'number' },
        { key: 'QUOTAEXC', label: 'QUOTAEXC', format: 'number' },
        { key: 'SKIPPED', label: 'SKIPPED', format: 'number' },
        { key: 'SPLIT', label: 'SPLIT', format: 'number' },
        { key: 'DELETED', label: 'DELETED', format: 'number' },
        { key: 'EXPORTKO', label: 'EXPORTKO', format: 'number' },
        { key: 'TRANSKO', label: 'TRANSKO', format: 'number' },
        { key: 'INVALID', label: 'INVALID', format: 'number' },
      ],
    },
  { key: 'email_prefix', label: 'Email Prefix' },
  { key: 'even_pages', label: 'Even Pages', format: 'boolean' },
  { key: 'force_ocr', label: 'Force OCR', format: 'boolean' },
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'is_master', label: 'Is Master', format: 'boolean' },
  { key: 'csv_download_authenticated', label: 'CSV Download Authenticated' },
  { key: 'json_download_authenticated', label: 'JSON Download Authenticated' },
  { key: 'xls_download_authenticated', label: 'Excel Download Authenticated' },
  { key: 'last_activity', label: 'Last Activity', format: 'datetime' },
  { key: 'master_parser_slug', label: 'Preset' },
  { key: 'name', label: 'Name' },
  { key: 'odd_pages', label: 'Odd Pages', format: 'boolean' },
  { key: 'page_range_set', label: 'Page Range Set' },
  { key: 'parser_object_count', label: 'Field Count', format: 'number' },
  {
      key: 'parser_object_set_last_modified',
      label: 'Parser Object Set Last Modified',
      format: 'datetime',
    },
  { key: 'process_attachments', label: 'Process Attachments', format: 'boolean' },
  { key: 'retention_policy', label: 'Retention Policy', format: 'number' },
  { key: 'split_keywords', label: 'Split Keywords' },
  { key: 'split_page', label: 'Split Page' },
  { key: 'split_page_range_set', label: 'Split Page Range Set' },
  { key: 'ai_split_instructions', label: 'AI Split Instructions' },
  { key: 'is_ai_split_enabled', label: 'Is AI Split Enabled', format: 'boolean' },
  { key: 'identification_error', label: 'Identification Error' },
  { key: 'template_count', label: 'Template Count', format: 'number' },
  { key: 'webhook_count', label: 'Webhook Count', format: 'number' },
  { key: 'workflow_enabled', label: 'Workflow Enabled', format: 'boolean' },
  { key: 'attachments_field', label: 'Attachments Field', format: 'boolean' },
  { key: 'original_document_field', label: 'Original Document Field', format: 'boolean' },
  { key: 'searchable_pdf_field', label: 'Searchable PDF Field', format: 'boolean' },
  { key: 'headers_field', label: 'Headers Field', format: 'boolean' },
  { key: 'created_field', label: 'Created Field', format: 'boolean' },
  { key: 'created_date_field', label: 'Created Date Field', format: 'boolean' },
  { key: 'created_time_field', label: 'Created Time Field', format: 'boolean' },
  { key: 'received_field', label: 'Received Field', format: 'boolean' },
  { key: 'received_date_field', label: 'Received Date Field', format: 'boolean' },
  { key: 'received_time_field', label: 'Received Time Field', format: 'boolean' },
  { key: 'processed_field', label: 'Processed Field', format: 'boolean' },
  { key: 'processed_date_field', label: 'Processed Date Field', format: 'boolean' },
  { key: 'processed_time_field', label: 'Processed Time Field', format: 'boolean' },
  { key: 'sender_field', label: 'Sender Field', format: 'boolean' },
  { key: 'sender_name_field', label: 'Sender Name Field', format: 'boolean' },
  { key: 'split_page_range_field', label: 'Split Page Range Field', format: 'boolean' },
  { key: 'split_parent_id_field', label: 'Split Parent ID Field', format: 'boolean' },
  { key: 'recipient_field', label: 'Recipient Field', format: 'boolean' },
  { key: 'to_field', label: 'To Field', format: 'boolean' },
  { key: 'cc_field', label: 'CC Field', format: 'boolean' },
  { key: 'bcc_field', label: 'BCC Field', format: 'boolean' },
  { key: 'reply_to_field', label: 'Reply To Field', format: 'boolean' },
  { key: 'recipient_suffix_field', label: 'Recipient Suffix Field', format: 'boolean' },
  { key: 'original_recipient_field', label: 'Original Recipient Field', format: 'boolean' },
  { key: 'subject_field', label: 'Subject Field', format: 'boolean' },
  { key: 'template_field', label: 'Template Field', format: 'boolean' },
  { key: 'html_document_field', label: 'HTML Document Field', format: 'boolean' },
  { key: 'text_document_field', label: 'Text Document Field', format: 'boolean' },
  { key: 'content_field', label: 'Content Field', format: 'boolean' },
  { key: 'last_reply_field', label: 'Last Reply Field', format: 'boolean' },
  { key: 'document_id_field', label: 'Document ID Field', format: 'boolean' },
  { key: 'parent_id_field', label: 'Parent ID Field', format: 'boolean' },
  { key: 'document_url_field', label: 'Document URL Field', format: 'boolean' },
  { key: 'public_document_url_field', label: 'Public Document URL Field', format: 'boolean' },
  { key: 'page_count_field', label: 'Page Count Field', format: 'boolean' },
  { key: 'credit_count_field', label: 'Credit Count Field', format: 'boolean' },
  { key: 'mailbox_id_field', label: 'Mailbox ID Field', format: 'boolean' },
  { key: 'parsing_engine_field', label: 'Parsing Engine Field', format: 'boolean' },
  {
      key: 'available_webhook_set',
      label: 'Available Webhook Set',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'event', label: 'Event' },
        { key: 'target', label: 'Target', format: 'url' },
        { key: 'name', label: 'Name' },
        { key: 'headers', label: 'Headers' },
        { key: 'category', label: 'Category' },
        { key: 'default_driver_fee_percentage', label: 'Default Driver Fee Percentage' },
        { key: 'parser_field_set', label: 'Parser Field Set' },
      ],
    },
  { key: 'webhook_set', label: 'Webhook Set' },
  { key: 'table_set', label: 'Table Set' },
];

const mailboxFields: OutputSchema['fields'] = [
  ...mailboxSummaryFields,
  { key: 'csv_download', label: 'CSV Download' },
  { key: 'decimal_separator', label: 'Decimal Separator' },
  { key: 'default_language', label: 'Default Language' },
  { key: 'default_timezone', label: 'Default Timezone' },
  { key: 'disable_document_links', label: 'Disable Document Links', format: 'boolean' },
  { key: 'emails_or_domains', label: 'Emails Or Domains' },
  { key: 'expand_result', label: 'Expand Result', format: 'boolean' },
  { key: 'extract_xml_from_comment', label: 'Extract XML From Comment', format: 'boolean' },
  { key: 'input_date_format', label: 'Input Date Format' },
  {
      key: 'input_date_format_autodetection',
      label: 'Input Date Format Autodetection',
      format: 'boolean',
    },
  { key: 'identification_status', label: 'Identification Status' },
  { key: 'is_transform_enabled', label: 'Is Transform Enabled', format: 'boolean' },
  { key: 'json_download', label: 'JSON Download' },
  {
      key: 'parser_object_set',
      label: 'Fields',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'format', label: 'Format' },
        { key: 'choice_set', label: 'Choice Set' },
        { key: 'is_required', label: 'Is Required', format: 'boolean' },
        { key: 'used_by_ai', label: 'Used By AI', format: 'boolean' },
        { key: 'query', label: 'Query' },
        { key: 'json_download', label: 'JSON Download' },
        { key: 'csv_download', label: 'CSV Download' },
        { key: 'xls_download', label: 'Excel Download' },
        { key: 'json_download_authenticated', label: 'JSON Download Authenticated' },
        { key: 'csv_download_authenticated', label: 'CSV Download Authenticated' },
        { key: 'xls_download_authenticated', label: 'Excel Download Authenticated' },
        { key: 'type', label: 'Type' },
      ],
    },
  { key: 'pdf_conversion_format', label: 'PDF Conversion Format' },
  { key: 'transform', label: 'Transform' },
  {
      key: 'use_whitelist_instead_of_blacklist',
      label: 'Use Whitelist Instead Of Blacklist',
      format: 'boolean',
    },
  { key: 'template_set_last_modified', label: 'Template Set Last Modified' },
  { key: 'xls_download', label: 'Excel Download' },
];

const templateFields: OutputSchema['fields'] = [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'parser', label: 'Mailbox ID', format: 'number' },
        { key: 'engine', label: 'Engine' },
        { key: 'action', label: 'Action' },
        { key: 'status', label: 'Status' },
        {
          key: 'margin',
          label: 'Margin',
          children: [
            {
              key: 'default',
              label: 'Default',
              children: [
                { key: 'lower', label: 'Lower', format: 'number' },
                { key: 'upper', label: 'Upper', format: 'number' },
              ],
            },
          ],
        },
        { key: 'document_count', label: 'Document Count', format: 'number' },
        { key: 'last_activity', label: 'Last Activity', format: 'datetime' },
        { key: 'decimal_separator', label: 'Decimal Separator' },
        { key: 'input_date_format', label: 'Input Date Format' },
];

const customDownloadFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'parser_id', label: 'Mailbox ID', format: 'number' },
  { key: 'items', label: 'Items' },
  { key: 'csv_download', label: 'CSV Download' },
  { key: 'xls_download', label: 'Excel Download' },
];

export const notificationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'notification_set',
      label: 'Notifications',
      children: [{ key: 'info', label: 'Messages' }],
    },
  ],
};

export const emailDocumentUploadOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'DocumentID', label: 'Document ID' },
    { key: 'DocumentIDs', label: 'Document IDs' },
  ],
};

export const fileDocumentUploadOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    {
      key: 'attachments',
      label: 'Uploaded Files',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'File Name' },
        { key: 'DocumentID', label: 'Document ID' },
      ],
    },
  ],
};

export const documentOutputSchema: OutputSchema = { fields: documentDetailFields };

export const documentListOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Documents',
      labelKey: 'name',
      listItems: [...documentFields, parsedDataField],
    },
  ],
};

export const findDocumentOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Documents',
      labelKey: 'name',
      listItems: documentFields,
    },
  ],
};

export const documentLogsOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Log Entries',
      labelKey: 'code',
      listItems: [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'code', label: 'Code' },
  { key: 'document', label: 'Document', format: 'number' },
  { key: 'document_name', label: 'Document Name' },
  { key: 'parser', label: 'Mailbox ID', format: 'number' },
  { key: 'parser_name', label: 'Mailbox Name' },
  { key: 'template', label: 'Template' },
  { key: 'template_name', label: 'Template Name' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'payload', label: 'Payload' },
  { key: 'message', label: 'Message' },
  { key: 'initiator', label: 'Initiator' },
  { key: 'initiator_name', label: 'Initiator Name' },
],
    },
  ],
};

export const deleteDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
  ],
};

export const mailboxOutputSchema: OutputSchema = { fields: mailboxFields };

export const mailboxListOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Mailboxes',
      labelKey: 'name',
      listItems: mailboxSummaryFields,
    },
  ],
};

export const newMailboxOutputSchema: OutputSchema = { fields: mailboxSummaryFields };

export const mailboxSchemaOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Type' },
    {
      key: 'properties',
      label: 'Fields',
      dynamicKey: true,
      children: [{ key: 'type', label: 'Type' }],
    },
  ],
};

export const customDownloadOutputSchema: OutputSchema = { fields: customDownloadFields };

export const customDownloadListOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Custom Downloads',
      labelKey: 'name',
      listItems: customDownloadFields,
    },
  ],
};

export const deleteCustomDownloadOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'mailboxId', label: 'Mailbox ID' },
    { key: 'customDownloadId', label: 'Custom Download ID' },
  ],
};

export const optionValuesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'choices',
      label: 'Choices',
      children: [
        { key: 'document.status', label: 'Document Status', value: "['document.status']" },
        {
          key: 'document.status_source',
          label: 'Document Status Source',
          value: "['document.status_source']",
        },
        { key: 'parser.ai_engine', label: 'Parser AI Engine', value: "['parser.ai_engine']" },
        { key: 'parser.ordering', label: 'Parser Ordering', value: "['parser.ordering']" },
        {
          key: 'parser.default_language',
          label: 'Parser Default Language',
          value: "['parser.default_language']",
        },
        {
          key: 'parser.pdf_conversion_format',
          label: 'Parser PDF Conversion Format',
          value: "['parser.pdf_conversion_format']",
        },
        {
          key: 'parser.identification_status',
          label: 'Parser Identification Status',
          value: "['parser.identification_status']",
        },
        {
          key: 'parser.supported_documents',
          label: 'Parser Supported Documents',
          value: "['parser.supported_documents']",
          children: [
            {
              key: 'documents',
              label: 'Documents',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'spreadsheets',
              label: 'Spreadsheets',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'presentations',
              label: 'Presentations',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'emails',
              label: 'Emails',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'web',
              label: 'Web',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'images_scans',
              label: 'Images Scans',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'calendars',
              label: 'Calendars',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
            {
              key: 'archives',
              label: 'Archives',
              children: [
                { key: 'extensions', label: 'Extensions' },
                { key: 'label', label: 'Label' },
              ],
            },
          ],
        },
        {
          key: 'parser_field.format',
          label: 'Parser Field Format',
          value: "['parser_field.format']",
        },
        { key: 'template.action', label: 'Template Action', value: "['template.action']" },
        { key: 'template.status', label: 'Template Status', value: "['template.status']" },
        {
          key: 'template.merge_row_behavior',
          label: 'Template Merge Row Behavior',
          value: "['template.merge_row_behavior']",
        },
        {
          key: 'template_field.format',
          label: 'Template Field Format',
          value: "['template_field.format']",
        },
        {
          key: 'template_object.errors.code',
          label: 'Template Object Errors Code',
          value: "['template_object.errors.code']",
        },
        {
          key: 'account.auto_subscription_feature',
          label: 'Account Auto Subscription Feature',
          value: "['account.auto_subscription_feature']",
        },
        {
          key: 'account.decimal_separator',
          label: 'Account Decimal Separator',
          value: "['account.decimal_separator']",
        },
        {
          key: 'account.default_timezone',
          label: 'Account Default Timezone',
          value: "['account.default_timezone']",
        },
        {
          key: 'account.input_date_format',
          label: 'Account Input Date Format',
          value: "['account.input_date_format']",
        },
        { key: 'user.roles', label: 'User Roles', value: "['user.roles']" },
        { key: 'user.permissions', label: 'User Permissions', value: "['user.permissions']" },
        { key: 'webhook.status', label: 'Webhook Status', value: "['webhook.status']" },
        { key: 'webhook.event', label: 'Webhook Event', value: "['webhook.event']" },
        { key: 'log.status', label: 'Log Status', value: "['log.status']" },
        { key: 'log.source', label: 'Log Source', value: "['log.source']" },
        { key: 'parser.master', label: 'Parser Master', value: "['parser.master']" },
      ],
    },
    {
      key: 'mappings',
      label: 'Mappings',
      children: [
        {
          key: 'field.format',
          label: 'Field Format',
          value: "['field.format']",
          children: [
            { key: 'TEXT', label: 'TEXT' },
            { key: 'ONELINE', label: 'ONELINE' },
            { key: 'TABLE', label: 'TABLE' },
            {
              key: 'TXT',
              label: 'TXT',
              children: [
                { key: 'TEXT', label: 'TEXT' },
                { key: 'ONELINE', label: 'ONELINE' },
                { key: 'TABLE', label: 'TABLE' },
              ],
            },
            { key: 'OCR', label: 'OCR', children: [{ key: 'TABLE', label: 'TABLE' }] },
          ],
        },
      ],
    },
    {
      key: 'max_field_lengths',
      label: 'Max Field Lengths',
      children: [
        { key: 'email', label: 'Email', format: 'number' },
        { key: 'name', label: 'Name', format: 'number' },
      ],
    },
    { key: 'max_table_depth', label: 'Max Table Depth', format: 'number' },
    {
      key: 'max_generate_fields_documents',
      label: 'Max Generate Fields Documents',
      format: 'number',
    },
    { key: 'email_domain', label: 'Email Domain' },
    {
      key: 'extra_fields',
      label: 'Extra Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'label', label: 'Label' },
        { key: 'info', label: 'Info' },
      ],
    },
    {
      key: 'master_parser_set',
      label: 'Master Parser Set',
      labelKey: 'name',
      listItems: [
        { key: 'slug', label: 'Slug' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
      ],
    },
  ],
};


export const deleteTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'templateId', label: 'Template ID' },
  ],
};

export const templateOutputSchema: OutputSchema = {
  fields: [
    ...templateFields,
    {
      key: 'template_object_set',
      label: 'Template Fields',
      labelKey: 'name',
      listItems: [
        {
          key: 'parser_field',
          label: 'Parser Field',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'format', label: 'Format' },
            { key: 'is_required', label: 'Is Required', format: 'boolean' },
            { key: 'used_by_ai', label: 'Used By AI', format: 'boolean' },
            { key: 'choice_set', label: 'Choice Set' },
            { key: 'name', label: 'Name' },
            { key: 'query', label: 'Query' },
            { key: 'type', label: 'Type' },
            { key: 'static_value', label: 'Static Value' },
          ],
        },
        { key: 'upper_left_relative_field', label: 'Upper Left Relative Field' },
        { key: 'lower_right_relative_field', label: 'Lower Right Relative Field' },
        { key: 'format', label: 'Format' },
        { key: 'id', label: 'ID' },
        { key: 'is_required', label: 'Is Required', format: 'boolean' },
        { key: 'name', label: 'Name' },
        {
          key: 'relative_box',
          label: 'Relative Box',
          children: [
            { key: 'left_x', label: 'Left X', format: 'number' },
            { key: 'upper_y', label: 'Upper Y', format: 'number' },
            { key: 'right_x', label: 'Right X', format: 'number' },
            { key: 'lower_y', label: 'Lower Y', format: 'number' },
            { key: 'start_page_index', label: 'Start Page Index', format: 'number' },
            { key: 'end_page_index', label: 'End Page Index', format: 'number' },
          ],
        },
        { key: 'type', label: 'Type' },
        { key: 'template_object_set', label: 'Template Fields' },
      ],
    },
    {
      key: 'sample_set',
      label: 'Sample Documents',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Document ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'comment', label: 'Comment' },
        { key: 'is_ocr_ready', label: 'Is OCR Ready', format: 'boolean' },
        { key: 'ocr_ready_url', label: 'OCR Ready URL', format: 'url' },
        {
          key: 'ocr_page_set',
          label: 'Pages',
          listItems: [
            {
              key: 'image',
              label: 'Image',
              children: [
                { key: 'url', label: 'URL', format: 'image' },
                { key: 'width', label: 'Width', format: 'number' },
                { key: 'height', label: 'Height', format: 'number' },
                { key: 'content_type', label: 'Content Type' },
              ],
            },
            { key: 'position', label: 'Position', format: 'number' },
            { key: 'included_in_range', label: 'Included In Range', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'template_static_object_set', label: 'Static Fields' },
    { key: 'unused_parser_object_set', label: 'Unused Mailbox Fields' },
  ],
};

export const templateListOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    {
      key: 'results',
      label: 'Templates',
      labelKey: 'name',
      listItems: templateFields,
    },
  ],
};
