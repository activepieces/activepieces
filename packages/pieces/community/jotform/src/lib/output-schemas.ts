import { OutputSchema } from '@activepieces/pieces-framework';

const jotformQuestionFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'text', label: 'Text' },
  { key: 'type', label: 'Type' },
  { key: 'order', label: 'Order' },
  { key: 'qid', label: 'Qid', format: 'number' },
];

const jotformAnswerFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'order', label: 'Order' },
  { key: 'text', label: 'Text' },
  { key: 'type', label: 'Type' },
];

const jotformFormSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'username', label: 'Username' },
  { key: 'title', label: 'Title' },
  { key: 'height', label: 'Height' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'last_submission', label: 'Last Submission', format: 'datetime' },
  { key: 'new', label: 'New', format: 'number' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'favorite', label: 'Favorite' },
  { key: 'archived', label: 'Archived' },
  { key: 'url', label: 'URL', format: 'url' },
];

const jotformReportFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'form_id', label: 'Form ID' },
  { key: 'title', label: 'Title' },
  { key: 'fields', label: 'Fields' },
  { key: 'list_type', label: 'List Type' },
  { key: 'status', label: 'Status' },
  { key: 'settings', label: 'Settings' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'isProtected', label: 'Is Protected', format: 'boolean' },
];

const jotformAccountFields: OutputSchema['fields'] = [
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'account_type', label: 'Account Type', format: 'url' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'region', label: 'Region' },
  { key: 'is_verified', label: 'Is Verified', format: 'boolean' },
  { key: 'usage', label: 'Usage', format: 'url' },
  { key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
  { key: 'language', label: 'Language' },
  { key: 'isHIPAA', label: 'Is HIPAA', format: 'boolean' },
];

export const jotformAddFormQuestionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'question',
      label: 'Question',
      value: '',
      listItems: jotformQuestionFields,
    },
  ],
  itemLabel: '{name}',
};

export const jotformAddLabelResourcesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      value: '',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
  itemLabel: '{id}',
};

export const jotformBulkCreateFormSubmissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'submissions',
      label: 'Submissions',
      value: '',
      listItems: [
        { key: 'submissionID', label: 'Submission ID' },
        { key: 'URL', label: 'URL', format: 'url' },
      ],
    },
  ],
};

export const jotformBulkReplaceFormPropertiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'formWidth', label: 'Form Width' },
    { key: 'activeRedirect', label: 'Active Redirect' },
    { key: 'formID', label: 'Form ID' },
  ],
};

export const jotformBulkReplaceFormQuestionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'questions',
      label: 'Questions',
      value: '',
      dynamicKey: true,
      labelKey: 'text',
      children: jotformQuestionFields,
    },
  ],
};

export const jotformBulkReplaceFormsOutputSchema: OutputSchema = {
  fields: jotformFormSummaryFields,
};

export const jotformCloneFormOutputSchema: OutputSchema = {
  fields: [
    ...jotformFormSummaryFields,
    { key: 'clonedPdfIdMapping', label: 'Cloned PDF ID Mapping' },
  ],
};

export const jotformCreateFormReportOutputSchema: OutputSchema = {
  fields: jotformReportFields,
};

export const jotformCreateFormSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'submissionID', label: 'Submission ID' },
    { key: 'URL', label: 'URL', format: 'url' },
  ],
};

export const jotformCreateLabelOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'color', label: 'Color' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At' },
    { key: 'owner', label: 'Owner' },
  ],
};

export const jotformDeleteFormOutputSchema: OutputSchema = {
  fields: jotformFormSummaryFields.filter((field) => field.key !== 'url'),
};

export const jotformDeleteFormQuestionOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result', value: '' },
  ],
};

export const jotformGetFormOutputSchema: OutputSchema = {
  fields: jotformFormSummaryFields,
};

export const jotformGetFormPropertiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'activeRedirect', label: 'Active Redirect' },
    { key: 'defaultAutoResponderEmailAssigned', label: 'Default Auto Responder Email Assigned' },
    { key: 'defaultEmailAssigned', label: 'Default Email Assigned' },
    { key: 'formType', label: 'Form Type' },
    { key: 'formWidth', label: 'Form Width' },
    { key: 'labelWidth', label: 'Label Width' },
    { key: 'lastQuestionID', label: 'Last Question ID' },
    { key: 'styles', label: 'Styles' },
    { key: 'thanktext', label: 'Thanktext' },
    {
      key: 'emails',
      label: 'Emails',
      labelKey: 'name',
      listItems: [
        { key: 'body', label: 'Body' },
        { key: 'branding21Email', label: 'Branding21 Email' },
        { key: 'dirty', label: 'Dirty' },
        { key: 'from', label: 'From' },
        { key: 'hideEmptyFields', label: 'Hide Empty Fields' },
        { key: 'html', label: 'HTML' },
        { key: 'lastQuestionID', label: 'Last Question ID' },
        { key: 'name', label: 'Name' },
        { key: 'newDisableFlow', label: 'New Disable Flow' },
        { key: 'pdfattachment', label: 'Pdfattachment' },
        { key: 'replyTo', label: 'Reply To' },
        { key: 'sendOnEdit', label: 'Send On Edit' },
        { key: 'sendOnSubmit', label: 'Send On Submit' },
        { key: 'subject', label: 'Subject' },
        { key: 'to', label: 'To', format: 'email' },
        { key: 'type', label: 'Type' },
        { key: 'uniqueID', label: 'Unique ID' },
        { key: 'uploadAttachment', label: 'Upload Attachment' },
      ],
    },
    { key: 'submissionSettings', label: 'Submission Settings' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'slug', label: 'Slug' },
    { key: 'id', label: 'ID' },
    { key: 'count', label: 'Count' },
    { key: 'title', label: 'Title' },
    { key: 'height', label: 'Height' },
    { key: 'status', label: 'Status' },
    { key: 'type', label: 'Type' },
    { key: 'formOwnerAccountType', label: 'Form Owner Account Type' },
    { key: 'isHIPAA', label: 'Is HIPAA' },
    { key: 'owner', label: 'Owner' },
    { key: 'formOwnerName', label: 'Form Owner Name' },
    { key: 'isEUForm', label: 'Is EUForm' },
    { key: 'defaultTheme', label: 'Default Theme' },
    { key: 'isNewPDFUser', label: 'Is New PDFUser', format: 'boolean' },
  ],
};

export const jotformGetFormPropertyByKeyOutputSchema: OutputSchema = {
  fields: [
    { key: 'formWidth', label: 'Form Width' },
  ],
};

export const jotformGetFormQuestionOutputSchema: OutputSchema = {
  fields: jotformQuestionFields,
};

export const jotformGetLabelOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'order', label: 'Order' },
    { key: 'color', label: 'Color' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At' },
    { key: 'owner', label: 'Owner' },
    { key: 'ownerType', label: 'Owner Type' },
  ],
};

export const jotformGetLabelResourcesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'resources',
      label: 'Resources',
      value: '',
      listItems: [
        ...jotformFormSummaryFields.filter((field) => field.key !== 'url'),
        { key: 'assetType', label: 'Asset Type' },
        { key: 'labels', label: 'Labels' },
      ],
    },
  ],
  itemLabel: '{title}',
};

export const jotformGetReportOutputSchema: OutputSchema = {
  fields: jotformReportFields,
};

export const jotformGetSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'form_id', label: 'Form ID' },
    { key: 'ip', label: 'IP' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'status', label: 'Status' },
    { key: 'new', label: 'New' },
    { key: 'flag', label: 'Flag' },
    { key: 'notes', label: 'Notes' },
    { key: 'updated_at', label: 'Updated At' },
    {
      key: 'answers',
      label: 'Answers',
      dynamicKey: true,
      labelKey: 'text',
      children: jotformAnswerFields,
    },
  ],
};

export const jotformGetSystemPlanOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'currency', label: 'Currency' },
    {
      key: 'limits',
      label: 'Limits',
      children: [
        { key: 'submissions', label: 'Submissions', format: 'number' },
        { key: 'overSubmissions', label: 'Over Submissions', format: 'number' },
        { key: 'sslSubmissions', label: 'Ssl Submissions', format: 'number' },
        { key: 'payments', label: 'Payments', format: 'number' },
        { key: 'uploads', label: 'Uploads', format: 'number' },
        { key: 'tickets', label: 'Tickets', format: 'number' },
        { key: 'subusers', label: 'Subusers', format: 'number' },
        { key: 'api-daily-limit', label: 'API Daily Limit', format: 'number' },
        { key: 'views', label: 'Views', format: 'number' },
        { key: 'formCount', label: 'Form Count', format: 'number' },
        { key: 'hipaaCompliance', label: 'Hipaa Compliance', format: 'boolean' },
        {
          key: 'emails',
          label: 'Emails',
          children: [
            { key: 'reminderEmailBlocks', label: 'Reminder Email Blocks', format: 'number' },
          ],
        },
        { key: 'fieldPerForm', label: 'Field Per Form', format: 'number' },
        { key: 'totalSubmissions', label: 'Total Submissions', format: 'number' },
        { key: 'signedDocuments', label: 'Signed Documents', format: 'number' },
        { key: 'elementPerWorkflow', label: 'Element Per Workflow', format: 'number' },
        { key: 'aiAgents', label: 'Ai Agents', format: 'number' },
        { key: 'aiConversations', label: 'Ai Conversations', format: 'number' },
        { key: 'aiSessions', label: 'Ai Sessions', format: 'number' },
        { key: 'aiPhoneCall', label: 'Ai Phone Call', format: 'number' },
        { key: 'aiKnowledgeBase', label: 'Ai Knowledge Base', format: 'number' },
        { key: 'aiAgentSms', label: 'Ai Agent Sms', format: 'number' },
      ],
    },
    {
      key: 'prices',
      label: 'Prices',
      children: [
        { key: 'monthly', label: 'Monthly', format: 'number' },
        { key: 'yearly', label: 'Yearly', format: 'number' },
        { key: 'biyearly', label: 'Biyearly', format: 'number' },
      ],
    },
    {
      key: 'plimusIDs',
      label: 'Plimus IDs',
      children: [
        { key: 'monthly', label: 'Monthly', format: 'number' },
        { key: 'yearly', label: 'Yearly', format: 'number' },
        { key: 'biyearly', label: 'Biyearly', format: 'number' },
      ],
    },
    {
      key: 'fastSpringURLs',
      label: 'Fast Spring URLs',
      children: [
        { key: 'monthly', label: 'Monthly' },
        { key: 'yearly', label: 'Yearly' },
        { key: 'biyearly', label: 'Biyearly' },
      ],
    },
    { key: 'planType', label: 'Plan Type' },
    { key: 'currentPlanType', label: 'Current Plan Type' },
    {
      key: 'fullPrices',
      label: 'Full Prices',
      children: [
        { key: 'monthly', label: 'Monthly', format: 'number' },
        { key: 'yearly', label: 'Yearly', format: 'number' },
        { key: 'biyearly', label: 'Biyearly', format: 'number' },
      ],
    },
    { key: 'campaign_status', label: 'Campaign Status' },
    { key: 'isVisible', label: 'Is Visible', format: 'boolean' },
  ],
};

export const jotformGetUserDetailsOutputSchema: OutputSchema = {
  fields: jotformAccountFields,
};

export const jotformGetUserHistoryOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'history',
      label: 'History',
      value: '',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'formID', label: 'Form ID' },
        { key: 'username', label: 'Username' },
        { key: 'creator', label: 'Creator' },
        { key: 'formTitle', label: 'Form Title' },
        { key: 'formStatus', label: 'Form Status' },
        { key: 'formSlug', label: 'Form Slug' },
        { key: 'ip', label: 'IP' },
        { key: 'timestamp', label: 'Timestamp', format: 'number' },
        { key: 'formType', label: 'Form Type' },
      ],
    },
  ],
};

export const jotformGetUserSettingsOutputSchema: OutputSchema = {
  fields: jotformAccountFields,
};

export const jotformGetUserUsageOutputSchema: OutputSchema = {
  fields: [
    { key: 'username', label: 'Username' },
    { key: 'submissions', label: 'Submissions' },
    { key: 'overSubmissions', label: 'Over Submissions' },
    { key: 'ssl_submissions', label: 'Ssl Submissions' },
    { key: 'payments', label: 'Payments' },
    { key: 'uploads', label: 'Uploads' },
    { key: 'total_submissions', label: 'Total Submissions' },
    { key: 'tickets', label: 'Tickets' },
    { key: 'views', label: 'Views' },
    { key: 'signed_documents', label: 'Signed Documents' },
    { key: 'workflow_runs', label: 'Workflow Runs' },
    { key: 'ai_conversations', label: 'Ai Conversations' },
    { key: 'ai_messages', label: 'Ai Messages' },
    { key: 'ai_sessions', label: 'Ai Sessions' },
    { key: 'ai_phone_call', label: 'Ai Phone Call' },
    { key: 'ai_agent_sms', label: 'Ai Agent Sms' },
    { key: 'ai_chatbot_conversations', label: 'Ai Chatbot Conversations' },
    { key: 'pdf_attachment_submissions', label: 'PDF Attachment Submissions' },
    { key: 'monthly_usage_reset_date', label: 'Monthly Usage Reset Date', format: 'datetime' },
    { key: 'mobile_submissions', label: 'Mobile Submissions' },
    { key: 'noupe_ai_conversations', label: 'Noupe Ai Conversations' },
    { key: 'sms_notifications', label: 'Sms Notifications' },
    { key: 'whatsapp_notifications', label: 'Whatsapp Notifications' },
    { key: 'pdf_generations', label: 'PDF Generations' },
    { key: 'website_widget_views', label: 'Website Widget Views' },
    { key: 'api', label: 'API', format: 'number' },
    { key: 'form_count', label: 'Form Count' },
    { key: 'ai_agents', label: 'Ai Agents', format: 'number' },
    { key: 'ai_chatbot_agents', label: 'Ai Chatbot Agents' },
    { key: 'ai_knowledge_base', label: 'Ai Knowledge Base' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const jotformListAllReportsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'reports',
      label: 'Reports',
      value: '',
      listItems: [
        ...jotformReportFields,
        { key: 'type', label: 'Type' },
        { key: 'form_title', label: 'Form Title' },
        { key: 'form_count', label: 'Form Count', format: 'number' },
        { key: 'form_url', label: 'Form URL', format: 'url' },
        { key: 'last_submission', label: 'Last Submission' },
        { key: 'properties', label: 'Properties' },
      ],
    },
  ],
  itemLabel: '{title}',
};

export const jotformListFormQuestionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'questions',
      label: 'Questions',
      value: '',
      dynamicKey: true,
      labelKey: 'text',
      children: [
        { key: 'name', label: 'Name' },
        { key: 'order', label: 'Order' },
        { key: 'qid', label: 'Qid', format: 'number' },
        { key: 'text', label: 'Text' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

export const jotformListFormReportsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'reports',
      label: 'Reports',
      value: '',
      listItems: jotformReportFields,
    },
  ],
  itemLabel: '{title}',
};

export const jotformListFormSubmissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'submissions',
      label: 'Submissions',
      value: '',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'form_id', label: 'Form ID' },
        { key: 'ip', label: 'IP' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'status', label: 'Status' },
        { key: 'new', label: 'New' },
        { key: 'flag', label: 'Flag' },
        { key: 'notes', label: 'Notes' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        {
          key: 'answers',
          label: 'Answers',
          dynamicKey: true,
          labelKey: 'text',
          children: jotformAnswerFields,
        },
      ],
    },
  ],
  itemLabel: '{id}',
};

export const jotformListFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'forms',
      label: 'Forms',
      value: '',
      listItems: jotformFormSummaryFields,
    },
  ],
  itemLabel: '{title}',
};

export const jotformListLabelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'owner', label: 'Owner' },
    { key: 'owner_type', label: 'Owner Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    {
      key: 'sublabels',
      label: 'Sublabels',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'order', label: 'Order' },
        { key: 'color', label: 'Color' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At' },
        { key: 'parent_label_id', label: 'Parent Label ID' },
        { key: 'owner', label: 'Owner' },
        { key: 'sublabels', label: 'Sublabels' },
      ],
    },
  ],
};

export const jotformUpdateFormPropertiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'formWidth', label: 'Form Width' },
    { key: 'labelWidth', label: 'Label Width' },
    { key: 'formID', label: 'Form ID' },
  ],
};

export const jotformUpdateFormQuestionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'question',
      label: 'Question',
      value: '',
      listItems: [
        { key: 'text', label: 'Text' },
        { key: 'type', label: 'Type' },
      ],
    },
  ],
};

export const jotformUpdateLabelOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Name' },
  ],
};
