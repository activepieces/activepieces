import { OutputSchema } from '@activepieces/pieces-framework';

const aggregateFields: OutputSchema['fields'] = [
  { key: 'delivered', label: 'Delivered', format: 'number' },
  { key: 'bounced', label: 'Bounced', format: 'number' },
  { key: 'opens', label: 'Opens', format: 'number' },
  { key: 'clicks', label: 'Clicks', format: 'number' },
  { key: 'suppressions', label: 'Suppressions', format: 'number' },
];

const statisticsFields: OutputSchema['fields'] = [
  { key: 'delivered', label: 'Delivered', format: 'number' },
  { key: 'bounced', label: 'Bounced', format: 'number' },
  { key: 'opened', label: 'Opened', format: 'number' },
  { key: 'clicked', label: 'Clicked', format: 'number' },
];

const inboundRouteFields: OutputSchema['fields'] = [
    { key: 'id', label: 'ID' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'domain_id', label: 'Domain ID', format: 'number' },
    { key: 'domain_name', label: 'Domain Name' },
    { key: 'description', label: 'Description' },
    { key: 'expression_type', label: 'Expression Type' },
    { key: 'header_name', label: 'Header Name' },
    { key: 'header_content', label: 'Header Content' },
    { key: 'recipient', label: 'Recipient', format: 'email' },
    { key: 'custom_expression', label: 'Custom Expression' },
    { key: 'regex_enabled', label: 'Regex Enabled', format: 'boolean' },
    { key: 'forward_list', label: 'Forward List' },
    { key: 'dmarc_alignment', label: 'DMARC Alignment', format: 'boolean' },
    { key: 'require_spf', label: 'Require SPF', format: 'boolean' },
    { key: 'require_dkim', label: 'Require DKIM', format: 'boolean' },
    { key: 'skip_spam_check', label: 'Skip Spam Check', format: 'boolean' },
    { key: 'stop', label: 'Stop', format: 'boolean' },
    { key: 'priority', label: 'Priority', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const mailerooGetStatisticsSummaryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'aggregate',
      label: 'Aggregate',
      children: aggregateFields,
    },
    { key: 'country_data', label: 'Country Data' },
  ],
};

export const mailerooListDomainsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'domains',
      label: 'Domains',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'domain_name', label: 'Domain Name' },
        {
          key: 'statistics',
          label: 'Statistics',
          children: statisticsFields,
        },
        { key: 'status', label: 'Status', format: 'boolean' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
  ],
};

export const mailerooListSuppressionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'suppressions',
      label: 'Suppressions',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'email_address', label: 'Email Address', format: 'email' },
        { key: 'reason', label: 'Reason' },
      ],
    },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
  ],
};

export const mailerooListTemplatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'templates',
      label: 'Templates',
      value: '',
      listItems: [
        { key: 'id', label: 'ID', format: 'number' },
        { key: 'type', label: 'Type' },
        { key: 'template_name', label: 'Template Name' },
        { key: 'preview_image', label: 'Preview Image' },
        { key: 'preview_url', label: 'Preview URL' },
        { key: 'processed', label: 'Processed', format: 'number' },
      ],
    },
  ],
  itemLabel: '{template_name}',
};

export const mailerooGetDomainAnalyticsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'aggregate',
      label: 'Aggregate',
      children: aggregateFields,
    },
    {
      key: 'timeline',
      label: 'Timeline',
      listItems: [
        { key: 'date', label: 'Date', format: 'date' },
        {
          key: 'totals',
          label: 'Totals',
          children: aggregateFields,
        },
      ],
    },
    {
      key: 'service_providers',
      label: 'Service Providers',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'count', label: 'Count', format: 'number' },
      ],
    },
  ],
};

export const mailerooDomainOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'domain_name', label: 'Domain Name' },
    {
      key: 'dns_records',
      label: 'DNS Records',
      children: [
        {
          key: 'dkim_record',
          label: 'DKIM Record',
          children: [
            { key: 'host', label: 'Host' },
            { key: 'record', label: 'Record' },
            { key: 'cname_fallback', label: 'CNAME Fallback' },
            { key: 'created', label: 'Created', format: 'boolean' },
          ],
        },
        {
          key: 'spf_record',
          label: 'SPF Record',
          children: [
            { key: 'host', label: 'Host' },
            { key: 'record', label: 'Record' },
            { key: 'created', label: 'Created', format: 'boolean' },
          ],
        },
        {
          key: 'dmarc_record',
          label: 'DMARC Record',
          children: [
            { key: 'host', label: 'Host' },
            { key: 'record', label: 'Record' },
            { key: 'created', label: 'Created', format: 'boolean' },
          ],
        },
        {
          key: 'mx_record',
          label: 'MX Record',
          listItems: [
            { key: 'host', label: 'Host' },
            { key: 'record', label: 'Record' },
            { key: 'priority', label: 'Priority', format: 'number' },
            { key: 'created', label: 'Created', format: 'boolean' },
          ],
        },
        {
          key: 'tracking_record',
          label: 'Tracking Record',
          children: [
            { key: 'host', label: 'Host' },
            { key: 'record', label: 'Record' },
            { key: 'created', label: 'Created', format: 'boolean' },
          ],
        },
      ],
    },
    { key: 'sandbox', label: 'Sandbox', format: 'boolean' },
    { key: 'free', label: 'Free', format: 'boolean' },
    { key: 'interaction_tracking', label: 'Interaction Tracking', format: 'boolean' },
    { key: 'custom_hostname_tracking', label: 'Custom Hostname Tracking', format: 'boolean' },
    { key: 'return_path', label: 'Return Path' },
    { key: 'status', label: 'Status', format: 'boolean' },
    {
      key: 'statistics',
      label: 'Statistics',
      children: statisticsFields,
    },
  ],
};

export const mailerooSearchDomainEmailLogsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'subject',
      listItems: [
        { key: 'message_id', label: 'Message ID' },
        { key: 'reference_id', label: 'Reference ID' },
        { key: 'instance_id', label: 'Instance ID', format: 'number' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'application_id', label: 'Application ID', format: 'number' },
        { key: 'subject', label: 'Subject' },
        { key: 'sender', label: 'Sender', format: 'email' },
        { key: 'recipients', label: 'Recipients' },
        {
          key: 'tags',
          label: 'Tags',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'value', label: 'Value' },
          ],
        },
        {
          key: 'events',
          label: 'Events',
          listItems: [
            { key: 'event_type', label: 'Event Type' },
            { key: 'timestamp', label: 'Timestamp', format: 'number' },
            { key: 'message', label: 'Message' },
            {
              key: 'data',
              label: 'Data',
              children: [
                { key: 'recipient', label: 'Recipient', format: 'email' },
              ],
            },
          ],
        },
        { key: 'datetime', label: 'Datetime', format: 'datetime' },
      ],
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const mailerooGetEmailLogOutputSchema: OutputSchema = {
  fields: [
    { key: 'from', label: 'From', format: 'email' },
    { key: 'to', label: 'To' },
    { key: 'raw_email', label: 'Raw Email' },
    { key: 'collected_on', label: 'Collected On', format: 'datetime' },
  ],
};

export const mailerooRenderEmailLogOutputSchema: OutputSchema = {
  fields: [
    { key: 'url', label: 'URL', format: 'url' },
  ],
};

export const mailerooResendEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'reference_id', label: 'Reference ID' },
  ],
};

export const mailerooInboundRouteOutputSchema: OutputSchema = {
  fields: inboundRouteFields,
};

export const mailerooListInboundRoutesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'id',
      listItems: inboundRouteFields,
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
  ],
};

export const mailerooSendBulkEmailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'reference_ids', label: 'Reference IDs' },
  ],
};

export const mailerooListScheduledEmailsOutputSchema: OutputSchema = {
  fields: [
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'subject',
      listItems: [
        { key: 'from', label: 'From' },
        { key: 'recipients', label: 'Recipients' },
        { key: 'reference_id', label: 'Reference ID' },
        { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
        { key: 'subject', label: 'Subject' },
        { key: 'tags', label: 'Tags' },
      ],
    },
    { key: 'total_count', label: 'Total Count', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
  ],
};

export const mailerooSendEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'reference_id', label: 'Reference ID' },
  ],
};

export const mailerooSendFromTemplateOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'reference_id', label: 'Reference ID' },
      ],
    },
    { key: 'message', label: 'Message' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const mailerooGetStatisticsTimelineOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'timeline',
      label: 'Timeline',
      value: '',
      listItems: [
        { key: 'date', label: 'Date', format: 'date' },
        {
          key: 'summary',
          label: 'Summary',
          children: [
            {
              key: 'aggregate',
              label: 'Aggregate',
              children: aggregateFields,
            },
            { key: 'country_data', label: 'Country Data' },
          ],
        },
      ],
    },
  ],
  itemLabel: '{date}',
};

export const mailerooCreateSuppressionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'email_address', label: 'Email Address', format: 'email' },
    { key: 'reason', label: 'Reason' },
  ],
};

export const mailerooCreateTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'template_name', label: 'Template Name' },
    { key: 'preview_image', label: 'Preview Image' },
    { key: 'preview_url', label: 'Preview URL' },
    { key: 'processed', label: 'Processed', format: 'number' },
  ],
};

export const mailerooGetTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'template_name', label: 'Template Name' },
    { key: 'preview_image', label: 'Preview Image' },
    { key: 'preview_url', label: 'Preview URL' },
    { key: 'processed', label: 'Processed', format: 'number' },
    { key: 'html', label: 'HTML' },
    { key: 'plaintext', label: 'Plaintext' },
  ],
};

export const mailerooUpdateDomainSettingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'interaction_tracking', label: 'Interaction Tracking', format: 'boolean' },
    { key: 'custom_hostname_tracking', label: 'Custom Hostname Tracking', format: 'boolean' },
    { key: 'return_path', label: 'Return Path' },
  ],
};

export const mailerooSuccessOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const mailerooDeleteScheduledEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};
