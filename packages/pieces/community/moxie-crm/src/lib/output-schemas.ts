import { OutputSchema } from '@activepieces/pieces-framework';

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'firstName', label: 'First Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile' },
  { key: 'role', label: 'Role' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'defaultContact', label: 'Default Contact', format: 'boolean' },
  { key: 'invoiceContact', label: 'Invoice Contact', format: 'boolean' },
  { key: 'portalAccess', label: 'Portal Access', format: 'boolean' },
  { key: 'notes', label: 'Notes' },
];

const paymentTermsFields: OutputSchema['fields'] = [
  { key: 'paymentDays', label: 'Payment Days', format: 'number' },
  { key: 'latePaymentFee', label: 'Late Payment Fee', format: 'number' },
  { key: 'depositAmount', label: 'Deposit Amount', format: 'number' },
  { key: 'depositType', label: 'Deposit Type' },
  { key: 'hourlyAmount', label: 'Hourly Amount', format: 'number' },
  { key: 'whoPaysCardFees', label: 'Who Pays Card Fees' },
  { key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
  { key: 'updatedBy', label: 'Updated By' },
];

const clientFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Client ID' },
  { key: 'name', label: 'Name' },
  { key: 'clientType', label: 'Client Type' },
  { key: 'initials', label: 'Initials' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'locality', label: 'State or Region' },
  { key: 'postal', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'phone', label: 'Phone' },
  { key: 'logo', label: 'Logo', format: 'image' },
  { key: 'color', label: 'Colour' },
  { key: 'taxId', label: 'Tax ID' },
  { key: 'leadSource', label: 'Lead Source' },
  { key: 'archive', label: 'Archived', format: 'boolean' },
  { key: 'hourlyAmount', label: 'Hourly Amount', format: 'number' },
  { key: 'roundingIncrement', label: 'Rounding Increment', format: 'number' },
  { key: 'defaultTaxRate', label: 'Default Tax Rate', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'payInstructions', label: 'Payment Instructions' },
  { key: 'notes', label: 'Notes' },
  { key: 'stripeClientId', label: 'Stripe Customer ID' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'lastInvoiceRunDate', label: 'Last Invoice Run Date', format: 'date' },
  { key: 'nextInvoiceRunDate', label: 'Next Invoice Run Date', format: 'date' },
  { key: 'paymentTerms', label: 'Payment Terms', children: paymentTermsFields },
  {
    key: 'integrationKeys',
    label: 'Integration Keys',
    children: [
      { key: 'quickbooksId', label: 'QuickBooks ID' },
      { key: 'xeroId', label: 'Xero ID' },
    ],
  },
];

const clientMiniFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Client ID' },
  { key: 'name', label: 'Name' },
  { key: 'clientType', label: 'Client Type' },
  { key: 'initials', label: 'Initials' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'locality', label: 'State or Region' },
  { key: 'postal', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'phone', label: 'Phone' },
  { key: 'logo', label: 'Logo', format: 'image' },
  { key: 'color', label: 'Colour' },
  { key: 'taxId', label: 'Tax ID' },
  { key: 'leadSource', label: 'Lead Source' },
  { key: 'archive', label: 'Archived', format: 'boolean' },
  { key: 'hourlyAmount', label: 'Hourly Amount', format: 'number' },
  { key: 'defaultTaxRate', label: 'Default Tax Rate', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'whoPaysCardFees', label: 'Who Pays Card Fees' },
];

const feeScheduleFields: OutputSchema['fields'] = [
  { key: 'feeType', label: 'Fee Type' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'estimateMin', label: 'Estimate Minimum', format: 'number' },
  { key: 'estimateMax', label: 'Estimate Maximum', format: 'number' },
  { key: 'taxable', label: 'Taxable', format: 'boolean' },
  { key: 'retainerSchedule', label: 'Retainer Schedule' },
  { key: 'retainerTiming', label: 'Retainer Timing' },
  { key: 'retainerPeriods', label: 'Retainer Periods', format: 'number' },
  { key: 'retainerOverageRate', label: 'Retainer Overage Rate', format: 'number' },
  { key: 'retainerActive', label: 'Retainer Active', format: 'boolean' },
  { key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
  { key: 'updatedBy', label: 'Updated By' },
];

const projectCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'projectTypeId', label: 'Project Type ID' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'hexColor', label: 'Colour' },
  { key: 'portalAccess', label: 'Client Portal Access' },
  { key: 'portalAccessAssignedOnly', label: 'Portal Access Assigned Only', format: 'boolean' },
  { key: 'showTimeWorkedInPortal', label: 'Show Time Worked In Portal', format: 'boolean' },
  { key: 'proposalId', label: 'Proposal ID' },
  { key: 'proposalName', label: 'Proposal Name' },
  { key: 'feeSchedule', label: 'Fee Schedule', children: feeScheduleFields },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'name', label: 'Name' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'projectTypeId', label: 'Project Type ID' },
  { key: 'statusId', label: 'Status ID' },
  { key: 'description', label: 'Description' },
  { key: 'descriptionFormat', label: 'Description Format' },
  { key: 'type', label: 'Type' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'taskPriority', label: 'Priority Label' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'completed', label: 'Completed', format: 'datetime' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'approvalRequired', label: 'Approval Required', format: 'boolean' },
  { key: 'approvalRequestedAt', label: 'Approval Requested At', format: 'datetime' },
  { key: 'isSubTask', label: 'Is Subtask', format: 'boolean' },
  { key: 'parentTaskId', label: 'Parent Task ID' },
  { key: 'subTaskSort', label: 'Subtask Sort', format: 'number' },
  { key: 'kanbanSort', label: 'Kanban Sort', format: 'number' },
  { key: 'ticketId', label: 'Ticket ID' },
  { key: 'product', label: 'Product' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'invoiceId', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'assignedToList', label: 'Assigned User IDs' },
  {
    key: 'events',
    label: 'Events',
    labelKey: 'user',
    listItems: [
      { key: 'user', label: 'User' },
      { key: 'events', label: 'Events' },
      { key: 'clientEvent', label: 'Client Event', format: 'boolean' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    ],
  },
];

const triggerProjectFields: OutputSchema['fields'] = [
  ...projectCoreFields,
  { key: 'client', label: 'Client', children: clientMiniFields },
];

const triggerTaskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'name', label: 'Name' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'projectTypeId', label: 'Project Type ID' },
  { key: 'statusId', label: 'Status ID' },
  { key: 'status', label: 'Status' },
  { key: 'description', label: 'Description' },
  { key: 'descriptionFormat', label: 'Description Format' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'taskPriority', label: 'Priority Label' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'completed', label: 'Completed', format: 'datetime' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'approvalRequired', label: 'Approval Required', format: 'boolean' },
  { key: 'isSubTask', label: 'Is Subtask', format: 'boolean' },
  { key: 'parentTaskId', label: 'Parent Task ID' },
  { key: 'subTaskSort', label: 'Subtask Sort', format: 'number' },
  { key: 'kanbanSort', label: 'Kanban Sort', format: 'number' },
  { key: 'ticketId', label: 'Ticket ID' },
  { key: 'product', label: 'Product' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'invoiceId', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'assignedTo', label: 'Assigned To' },
  { key: 'assignedToList', label: 'Assigned User IDs' },
  {
    key: 'project',
    label: 'Project',
    children: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Name' },
      { key: 'clientId', label: 'Client ID' },
      { key: 'projectTypeId', label: 'Project Type ID' },
      { key: 'active', label: 'Active', format: 'boolean' },
      { key: 'hexColor', label: 'Colour' },
    ],
  },
  {
    key: 'client',
    label: 'Client',
    children: [
      { key: 'id', label: 'Client ID' },
      { key: 'name', label: 'Name' },
      { key: 'initials', label: 'Initials' },
      { key: 'logo', label: 'Logo', format: 'image' },
      { key: 'color', label: 'Colour' },
    ],
  },
  {
    key: 'events',
    label: 'Events',
    labelKey: 'user',
    listItems: [
      { key: 'user', label: 'User' },
      { key: 'events', label: 'Events' },
      { key: 'clientEvent', label: 'Client Event', format: 'boolean' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    ],
  },
];

const triggerTimeEntryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Time Entry ID' },
  { key: 'userId', label: 'User ID', format: 'number' },
  { key: 'userFullName', label: 'User Full Name' },
  { key: 'timerStart', label: 'Timer Start', format: 'datetime' },
  { key: 'timerEnd', label: 'Timer End', format: 'datetime' },
  { key: 'pausedAt', label: 'Paused At', format: 'datetime' },
  { key: 'pausedSeconds', label: 'Paused Seconds', format: 'number' },
  { key: 'duration', label: 'Duration', format: 'duration' },
  { key: 'wasRounded', label: 'Was Rounded', format: 'boolean' },
  { key: 'billable', label: 'Billable', format: 'boolean' },
  { key: 'notes', label: 'Notes' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'clientName', label: 'Client Name' },
  { key: 'projectId', label: 'Project ID' },
  { key: 'projectName', label: 'Project Name' },
  { key: 'deliverableId', label: 'Task ID' },
  { key: 'deliverableName', label: 'Task Name' },
  { key: 'ticketId', label: 'Ticket ID' },
  { key: 'ticketName', label: 'Ticket Name' },
  { key: 'invoiceId', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
  { key: 'timestampUpdated', label: 'Timestamp Updated', format: 'datetime' },
];

const triggerOpportunityFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Opportunity ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'statusId', label: 'Stage ID' },
  { key: 'statusLabel', label: 'Stage' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'sentiment', label: 'Sentiment', format: 'number' },
  { key: 'timePeriod', label: 'Time Period' },
  { key: 'periods', label: 'Periods', format: 'number' },
  { key: 'estCloseDate', label: 'Estimated Close Date', format: 'date' },
  { key: 'actualCloseDate', label: 'Actual Close Date', format: 'date' },
  { key: 'wonOn', label: 'Won On', format: 'date' },
  { key: 'archive', label: 'Archived', format: 'boolean' },
  { key: 'kanbanSort', label: 'Kanban Sort', format: 'number' },
  { key: 'created', label: 'Created', format: 'datetime' },
  {
    key: 'formData',
    label: 'Lead Details',
    children: [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'role', label: 'Role' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'website', label: 'Website', format: 'url' },
      { key: 'address1', label: 'Address Line 1' },
      { key: 'address2', label: 'Address Line 2' },
      { key: 'city', label: 'City' },
      { key: 'locality', label: 'State or Region' },
      { key: 'postal', label: 'Postal Code' },
      { key: 'country', label: 'Country' },
      { key: 'sourceUrl', label: 'Source URL', format: 'url' },
      { key: 'leadSource', label: 'Lead Source' },
    ],
  },
  {
    key: 'comments',
    label: 'Comments',
    labelKey: 'author',
    listItems: [
      { key: 'id', label: 'Comment ID' },
      { key: 'author', label: 'Author' },
      { key: 'comment', label: 'Comment' },
      { key: 'clientComment', label: 'Client Comment', format: 'boolean' },
      { key: 'privateComment', label: 'Private Comment', format: 'boolean' },
      { key: 'edited', label: 'Edited', format: 'boolean' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    ],
  },
  {
    key: 'workflow',
    label: 'Workflow',
    labelKey: 'itemType',
    listItems: [
      { key: 'id', label: 'Item ID' },
      { key: 'itemId', label: 'Referenced ID' },
      { key: 'itemType', label: 'Item Type' },
      { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    ],
  },
];

export const createClientActionOutputSchema: OutputSchema = {
  fields: clientFields,
};

export const createContactActionOutputSchema: OutputSchema = {
  fields: contactFields,
};

export const createProjectActionOutputSchema: OutputSchema = {
  fields: [
    ...projectCoreFields,
    { key: 'description', label: 'Description' },
    { key: 'dateCompleted', label: 'Date Completed', format: 'date' },
    { key: 'proposalVersion', label: 'Proposal Version', format: 'number' },
    { key: 'clientMini', label: 'Client', children: clientMiniFields },
  ],
};

export const createTaskActionOutputSchema: OutputSchema = {
  fields: taskFields,
};

export const searchContactsActionOutputSchema: OutputSchema = {
  itemLabel: '{firstName} {lastName}',
  fields: [
    {
      key: 'contacts',
      label: 'Contacts',
      value: '',
      labelKey: 'firstName',
      listItems: contactFields,
    },
  ],
};

export const listClientsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'clients',
      label: 'Clients',
      value: '',
      labelKey: 'name',
      listItems: clientFields,
    },
  ],
};

export const searchClientsActionOutputSchema: OutputSchema = listClientsActionOutputSchema;

export const searchProjectsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      value: '',
      labelKey: 'name',
      listItems: [
        ...projectCoreFields,
        {
          key: 'paymentHistory',
          label: 'Payment History',
          labelKey: 'invoiceNumberFormatted',
          listItems: [
            { key: 'invoiceId', label: 'Invoice ID' },
            { key: 'invoiceNumber', label: 'Invoice Number', format: 'number' },
            { key: 'invoiceNumberFormatted', label: 'Invoice Number Formatted' },
            { key: 'invoiceStatus', label: 'Invoice Status' },
            { key: 'invoiceDate', label: 'Invoice Date', format: 'date' },
            { key: 'dateSent', label: 'Date Sent', format: 'date' },
            { key: 'dateDue', label: 'Date Due', format: 'date' },
            { key: 'amount', label: 'Amount', format: 'number' },
            { key: 'amountDue', label: 'Amount Due', format: 'number' },
            { key: 'currency', label: 'Currency' },
            { key: 'description', label: 'Description' },
            { key: 'itemType', label: 'Item Type' },
          ],
        },
      ],
    },
  ],
};

export const listPipelineStagesActionOutputSchema: OutputSchema = {
  itemLabel: '{label}',
  fields: [
    {
      key: 'stages',
      label: 'Pipeline Stages',
      value: '',
      labelKey: 'label',
      listItems: [
        { key: 'id', label: 'Stage ID' },
        { key: 'label', label: 'Label' },
        { key: 'hexColor', label: 'Colour' },
        { key: 'stageType', label: 'Stage Type' },
      ],
    },
  ],
};

export const listWorkspaceUsersActionOutputSchema: OutputSchema = {
  itemLabel: '{user.firstName} {user.lastName}',
  fields: [
    {
      key: 'users',
      label: 'Workspace Users',
      value: '',
      labelKey: 'userType',
      listItems: [
        { key: 'userType', label: 'User Type' },
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'userId', label: 'User ID', format: 'number' },
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'phone', label: 'Phone' },
            { key: 'phoneVerified', label: 'Phone Verified', format: 'boolean' },
            { key: 'profilePicture', label: 'Profile Picture', format: 'image' },
            { key: 'uuid', label: 'UUID' },
          ],
        },
      ],
    },
  ],
};

export const clientEventTriggerOutputSchema: OutputSchema = { fields: clientFields };

export const projectEventTriggerOutputSchema: OutputSchema = { fields: triggerProjectFields };

export const projectTaskEventTriggerOutputSchema: OutputSchema = { fields: triggerTaskFields };

export const timeEntryEventTriggerOutputSchema: OutputSchema = { fields: triggerTimeEntryFields };

export const opportunityEventTriggerOutputSchema: OutputSchema = { fields: triggerOpportunityFields };

export const moxieCRMTriggerOutputSchemas: Record<string, OutputSchema> = {
  client_created: clientEventTriggerOutputSchema,
  client_updated: clientEventTriggerOutputSchema,
  client_deleted: clientEventTriggerOutputSchema,
  project_created: projectEventTriggerOutputSchema,
  project_updated: projectEventTriggerOutputSchema,
  project_completed: projectEventTriggerOutputSchema,
  task_created: projectTaskEventTriggerOutputSchema,
  task_updated: projectTaskEventTriggerOutputSchema,
  task_deleted: projectTaskEventTriggerOutputSchema,
  client_task_approval: projectTaskEventTriggerOutputSchema,
  time_entry_created: timeEntryEventTriggerOutputSchema,
  time_entry_updated: timeEntryEventTriggerOutputSchema,
  time_entry_deleted: timeEntryEventTriggerOutputSchema,
  opportunity_created: opportunityEventTriggerOutputSchema,
  opportunity_updated: opportunityEventTriggerOutputSchema,
  opportunity_deleted: opportunityEventTriggerOutputSchema,
};
