import { OutputSchema } from '@activepieces/pieces-framework';

const customValueFields: OutputSchema['fields'] = [
  { key: 'fieldId', label: 'Field ID' },
  { key: 'mappingKey', label: 'Mapping Key' },
  { key: 'fieldName', label: 'Field Name' },
  { key: 'value', label: 'Value' },
  { key: 'type', label: 'Field Type' },
];

const customValuesField: OutputSchema['fields'][number] = {
  key: 'customValues',
  label: 'Custom Values',
  labelKey: 'fieldName',
  listItems: customValueFields,
};

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
  customValuesField,
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
  { key: 'contacts', label: 'Contacts', labelKey: 'email', listItems: contactFields },
  customValuesField,
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
  customValuesField,
];

const subtaskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Subtask ID' },
  { key: 'description', label: 'Description' },
  { key: 'complete', label: 'Complete', format: 'boolean' },
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
  customValuesField,
  { key: 'tasks', label: 'Subtasks', labelKey: 'description', listItems: subtaskFields },
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

const idNameFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
];

const taskMiniFields: OutputSchema['fields'] = [
  ...triggerTaskFields,
  customValuesField,
  { key: 'tasks', label: 'Subtasks', labelKey: 'description', listItems: subtaskFields },
];

const opportunityFields: OutputSchema['fields'] = [
  ...triggerOpportunityFields,
  { key: 'client', label: 'Client', children: idNameFields },
  customValuesField,
  {
    key: 'toDos',
    label: 'To-dos',
    labelKey: 'item',
    listItems: [
      { key: 'id', label: 'To-do ID' },
      { key: 'item', label: 'Item' },
      { key: 'complete', label: 'Complete', format: 'boolean' },
      { key: 'dueDate', label: 'Due Date', format: 'date' },
    ],
  },
];

const invoicePaymentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment ID' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'currency', label: 'Currency' },
  { key: 'datePaid', label: 'Date Paid', format: 'date' },
  { key: 'paidBy', label: 'Paid By' },
  { key: 'paymentProvider', label: 'Payment Method' },
  { key: 'referenceNumber', label: 'Reference Number' },
  { key: 'memo', label: 'Memo' },
  { key: 'pending', label: 'Pending', format: 'boolean' },
];

const invoiceMiniFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number', format: 'number' },
  { key: 'invoiceNumberFormatted', label: 'Invoice Number Formatted' },
  { key: 'description', label: 'Description' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'status', label: 'Status' },
  { key: 'invoiceType', label: 'Invoice Type' },
  { key: 'dateCreated', label: 'Date Created', format: 'date' },
  { key: 'dateSent', label: 'Date Sent', format: 'date' },
  { key: 'dateDue', label: 'Date Due', format: 'date' },
  { key: 'datePaid', label: 'Date Paid', format: 'date' },
  { key: 'currency', label: 'Currency' },
  { key: 'subTotal', label: 'Subtotal', format: 'currency' },
  { key: 'discountAmount', label: 'Discount Amount', format: 'currency' },
  { key: 'tax', label: 'Tax', format: 'currency' },
  { key: 'taxPercentage', label: 'Tax Percentage', format: 'number' },
  { key: 'total', label: 'Total', format: 'currency' },
  { key: 'paymentTotal', label: 'Payment Total', format: 'currency' },
  { key: 'amountDue', label: 'Amount Due', format: 'currency' },
  { key: 'viewOnlineUrl', label: 'View Online URL', format: 'url' },
  {
    key: 'clientInfo',
    label: 'Client',
    children: [
      { key: 'id', label: 'Client ID' },
      { key: 'name', label: 'Name' },
      { key: 'taxId', label: 'Tax ID' },
    ],
  },
  { key: 'payments', label: 'Payments', labelKey: 'datePaid', listItems: invoicePaymentFields },
  {
    key: 'lineItems',
    label: 'Line Items',
    labelKey: 'description',
    listItems: [
      { key: 'description', label: 'Description' },
      { key: 'quantity', label: 'Quantity', format: 'number' },
      { key: 'unitPrice', label: 'Unit Price', format: 'currency' },
      { key: 'unit', label: 'Unit' },
      { key: 'taxable', label: 'Taxable', format: 'boolean' },
      { key: 'lineTotal', label: 'Line Total', format: 'currency' },
      { key: 'type', label: 'Type' },
      { key: 'projectName', label: 'Project Name' },
    ],
  },
  {
    key: 'taxBreakdown',
    label: 'Tax Breakdown',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Tax Name' },
      { key: 'rate', label: 'Rate', format: 'number' },
      { key: 'taxableAmount', label: 'Taxable Amount', format: 'currency' },
      { key: 'amount', label: 'Amount', format: 'currency' },
    ],
  },
];

const expenseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Expense ID' },
  { key: 'amount', label: 'Amount', format: 'currency' },
  { key: 'tax', label: 'Tax', format: 'currency' },
  { key: 'taxRate', label: 'Tax Rate', format: 'number' },
  { key: 'total', label: 'Total', format: 'currency' },
  { key: 'totalWithMarkup', label: 'Total With Markup', format: 'currency' },
  { key: 'markupPercent', label: 'Markup Percentage', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'category', label: 'Category' },
  { key: 'billNo', label: 'Bill Number' },
  { key: 'description', label: 'Description' },
  { key: 'notes', label: 'Notes' },
  { key: 'paid', label: 'Paid', format: 'boolean' },
  { key: 'paidDate', label: 'Paid Date', format: 'date' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'reimbursable', label: 'Billable to Client', format: 'boolean' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'invoiceId', label: 'Invoice ID' },
  { key: 'invoiceNumber', label: 'Invoice Number' },
  { key: 'vendor', label: 'Vendor', children: idNameFields },
  { key: 'client', label: 'Client', children: idNameFields },
  { key: 'project', label: 'Project', children: idNameFields },
];

const ticketFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Ticket ID' },
  { key: 'ticketNumber', label: 'Ticket Number', format: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'type', label: 'Ticket Type' },
  { key: 'status', label: 'Status' },
  { key: 'open', label: 'Open', format: 'boolean' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'unread', label: 'Unread', format: 'boolean' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'summary', label: 'Summary' },
  { key: 'lastComment', label: 'Last Comment' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'closed', label: 'Closed', format: 'datetime' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'assignedTo', label: 'Assigned User IDs' },
  { key: 'ccList', label: 'CC List' },
  { key: 'client', label: 'Client', children: idNameFields },
];

const ticketWrapperFields: OutputSchema['fields'] = [
  { key: 'ticket', label: 'Ticket', children: ticketFields },
  {
    key: 'comments',
    label: 'Comments',
    labelKey: 'commentUserName',
    listItems: [
      { key: 'id', label: 'Comment ID' },
      { key: 'commentUserName', label: 'Author' },
      { key: 'commentUserEmail', label: 'Author Email', format: 'email' },
      { key: 'comment', label: 'Comment' },
      { key: 'commentType', label: 'Visibility' },
      { key: 'created', label: 'Created', format: 'datetime' },
    ],
  },
];

const calendarEventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event ID' },
  { key: 'summary', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'location', label: 'Location' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'startTime', label: 'Start Time' },
  { key: 'endDate', label: 'End Date', format: 'date' },
  { key: 'endTime', label: 'End Time' },
  { key: 'timezone', label: 'Time Zone' },
  { key: 'dateOnly', label: 'All Day', format: 'boolean' },
  { key: 'busyEvent', label: 'Busy', format: 'boolean' },
  { key: 'userId', label: 'Owner User ID', format: 'number' },
];

const agreementFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Agreement ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'statusTime', label: 'Status Changed', format: 'datetime' },
  { key: 'currency', label: 'Currency' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateCompleted', label: 'Completed', format: 'datetime' },
  { key: 'fullyExecuted', label: 'Fully Executed', format: 'boolean' },
  { key: 'userSigned', label: 'Signed by You', format: 'boolean' },
  { key: 'clientSigned', label: 'Signed by Client', format: 'boolean' },
  { key: 'client', label: 'Client', children: idNameFields },
];

const formSubmissionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Submission ID' },
  { key: 'formName', label: 'Form Name' },
  { key: 'clientId', label: 'Client ID' },
  { key: 'opportunityId', label: 'Opportunity ID' },
  { key: 'submittedAt', label: 'Submitted At', format: 'datetime' },
  { key: 'summary', label: 'Summary' },
  { key: 'notes', label: 'Notes' },
  {
    key: 'formData',
    label: 'Lead Details',
    children: [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'phone', label: 'Phone' },
      { key: 'businessName', label: 'Business Name' },
      { key: 'website', label: 'Website', format: 'url' },
      { key: 'leadSource', label: 'Lead Source' },
    ],
  },
];

const taskStageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Stage ID' },
  { key: 'label', label: 'Label' },
  { key: 'hexColor', label: 'Colour' },
  { key: 'complete', label: 'Marks Complete', format: 'boolean' },
  { key: 'clientApproval', label: 'Needs Client Approval', format: 'boolean' },
];

const customFieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'name', label: 'Name' },
  { key: 'mappingKey', label: 'Mapping Key' },
  { key: 'type', label: 'Type' },
];

const projectTypeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project Type ID' },
  { key: 'name', label: 'Name' },
  { key: 'isDefaultProjectType', label: 'Default', format: 'boolean' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'statusList', label: 'Task Stages', labelKey: 'label', listItems: taskStageFields },
  { key: 'projectFields', label: 'Project Fields', labelKey: 'name', listItems: customFieldDefinitionFields },
  { key: 'deliverableFields', label: 'Task Fields', labelKey: 'name', listItems: customFieldDefinitionFields },
];

const accountFields: OutputSchema['fields'] = [
  { key: 'accountId', label: 'Account ID', format: 'number' },
  { key: 'accountName', label: 'Account Name' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'locality', label: 'State or Region' },
  { key: 'postal', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'taxId', label: 'Tax ID' },
  { key: 'taxLabel', label: 'Tax Label' },
  { key: 'currency', label: 'Currency' },
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
          key: 'client',
          label: 'Client',
          children: [
            { key: 'id', label: 'Client ID' },
            { key: 'name', label: 'Name' },
          ],
        },
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

export const invoiceEventTriggerOutputSchema: OutputSchema = { fields: invoiceMiniFields };

export const ticketEventTriggerOutputSchema: OutputSchema = { fields: ticketWrapperFields };

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
  invoice_sent: invoiceEventTriggerOutputSchema,
  payment_received: invoiceEventTriggerOutputSchema,
  invoice_voided: invoiceEventTriggerOutputSchema,
  invoice_write_off: invoiceEventTriggerOutputSchema,
  ticket_created: ticketEventTriggerOutputSchema,
  ticket_updated: ticketEventTriggerOutputSchema,
  ticket_comment_added: ticketEventTriggerOutputSchema,
  ticket_closed: ticketEventTriggerOutputSchema,
  ticket_deleted: ticketEventTriggerOutputSchema,
};

export const moxieActionOutputSchemas = {
  client: { fields: clientFields } satisfies OutputSchema,
  contact: { fields: contactFields } satisfies OutputSchema,
  project: createProjectActionOutputSchema,
  task: { fields: taskFields } satisfies OutputSchema,
  taskList: listSchema({ key: 'tasks', label: 'Tasks', labelKey: 'name', itemLabel: '{name}', fields: taskMiniFields }),
  approvedTask: { fields: taskMiniFields } satisfies OutputSchema,
  opportunity: { fields: opportunityFields } satisfies OutputSchema,
  timeEntry: { fields: triggerTimeEntryFields } satisfies OutputSchema,
  invoice: { fields: invoiceMiniFields } satisfies OutputSchema,
  payment: {
    fields: [...invoiceMiniFields, { key: 'already_applied', label: 'Already Applied', format: 'boolean' }],
  } satisfies OutputSchema,
  invoiceList: listSchema({ key: 'invoices', label: 'Invoices', labelKey: 'invoiceNumberFormatted', itemLabel: '{invoiceNumberFormatted}', fields: invoiceMiniFields }),
  expense: { fields: expenseFields } satisfies OutputSchema,
  ticket: { fields: ticketFields } satisfies OutputSchema,
  ticketWrapper: { fields: ticketWrapperFields } satisfies OutputSchema,
  ticketList: listSchema({ key: 'tickets', label: 'Tickets', labelKey: 'subject', itemLabel: '#{ticketNumber} {subject}', fields: ticketFields }),
  calendarEvent: { fields: calendarEventFields } satisfies OutputSchema,
  deletedCalendarEvent: {
    fields: [
      { key: 'id', label: 'Event ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  agreementList: listSchema({ key: 'agreements', label: 'Agreements', labelKey: 'name', itemLabel: '{name}', fields: agreementFields }),
  formSubmission: { fields: formSubmissionFields } satisfies OutputSchema,
  attachment: {
    fields: [
      { key: 'url', label: 'File URL', format: 'url' },
      { key: 'objectType', label: 'Attached To Type' },
      { key: 'objectId', label: 'Attached To ID' },
      { key: 'fileName', label: 'File Name' },
    ],
  } satisfies OutputSchema,
  nameList: listSchema({ key: 'items', label: 'Names', labelKey: 'name', itemLabel: '{name}', fields: [{ key: 'name', label: 'Name' }] }),
  taskStageList: listSchema({ key: 'stages', label: 'Task Stages', labelKey: 'label', itemLabel: '{label}', fields: taskStageFields }),
  projectTypeList: listSchema({ key: 'projectTypes', label: 'Project Types', labelKey: 'name', itemLabel: '{name}', fields: projectTypeFields }),
  emailTemplateList: listSchema({ key: 'templates', label: 'Email Templates', labelKey: 'name', itemLabel: '{name}', fields: idNameFields }),
  emailTemplate: {
    fields: [
      { key: 'id', label: 'Template ID' },
      { key: 'name', label: 'Name' },
      { key: 'subject', label: 'Subject' },
      { key: 'htmlContent', label: 'HTML Content', format: 'html' },
    ],
  } satisfies OutputSchema,
  account: { fields: accountFields } satisfies OutputSchema,
};

function listSchema({ key, label, labelKey, itemLabel, fields }: { key: string; label: string; labelKey: string; itemLabel: string; fields: OutputSchema['fields'] }): OutputSchema {
  return { itemLabel, fields: [{ key, label, value: '', labelKey, listItems: fields }] };
}
