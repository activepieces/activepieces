import { MoxieFieldSpec } from './props';

export const CLIENT_DETAIL_FIELDS: MoxieFieldSpec[] = [
  { key: 'clientType', kind: 'enum', displayName: 'Client Type', options: ['Client', 'Prospect'], description: 'Client for a paying account, Prospect for a lead.' },
  { key: 'initials', kind: 'text', displayName: 'Initials', clearable: true },
  { key: 'address1', kind: 'text', displayName: 'Address Line 1', clearable: true },
  { key: 'address2', kind: 'text', displayName: 'Address Line 2', clearable: true },
  { key: 'city', kind: 'text', displayName: 'City', clearable: true },
  { key: 'locality', kind: 'text', displayName: 'State or Region', clearable: true },
  { key: 'postal', kind: 'text', displayName: 'Postal Code', clearable: true },
  { key: 'country', kind: 'text', displayName: 'Country', description: 'Two-letter ISO 3166-1 country code, for example US.', clearable: true },
  { key: 'website', kind: 'text', displayName: 'Website', clearable: true },
  { key: 'phone', kind: 'text', displayName: 'Phone', clearable: true },
  { key: 'color', kind: 'text', displayName: 'Colour', description: 'Hex colour, for example #78909C.' },
  { key: 'taxId', kind: 'text', displayName: 'Tax ID', clearable: true },
  { key: 'leadSource', kind: 'text', displayName: 'Lead Source', clearable: true },
  { key: 'payInstructions', kind: 'longText', displayName: 'Payment Instructions', clearable: true },
  { key: 'hourlyAmount', kind: 'number', displayName: 'Hourly Rate', min: 0 },
  { key: 'roundingIncrement', kind: 'integer', displayName: 'Time Rounding Increment', description: 'Minutes to round tracked time to.', min: 0 },
  { key: 'currency', kind: 'text', displayName: 'Currency', description: 'Three-letter ISO 4217 code, for example USD.' },
  { key: 'notes', kind: 'longText', displayName: 'Notes', clearable: true },
  { key: 'archive', kind: 'triState', displayName: 'Archived', description: 'Yes archives the client, No restores it. Leave empty to keep the current state.' },
];

export const CONTACT_FLAG_FIELDS: MoxieFieldSpec[] = [
  { key: 'defaultContact', kind: 'triState', displayName: 'Default Contact', description: "Yes makes this the client's primary contact." },
  { key: 'invoiceContact', kind: 'triState', displayName: 'Invoice Contact', description: 'Yes sends invoices for the client to this contact.' },
  { key: 'portalAccess', kind: 'triState', displayName: 'Portal Access', description: 'Yes lets this contact sign in to the client portal.' },
];

export const PORTAL_ACCESS_OPTIONS = ['Full access', 'Read only', 'Overview', 'None'];

export const FEE_TYPE_OPTIONS = ['Hourly', 'Fixed Price', 'Retainer', 'Per Item'];

export const PAYMENT_TYPE_OPTIONS = [
  'STRIPE',
  'CHECK',
  'BANK_TRANSFER',
  'CASH',
  'VENMO',
  'PAYPAL',
  'ZELLE',
  'APP_PAYOUT',
  'CREDIT_CARD',
  'OTHER',
];

export const ATTACHMENT_OBJECT_TYPES = ['CLIENT', 'PROJECT', 'DELIVERABLE', 'OPPORTUNITY', 'EXPENSE', 'TICKET'];

export const moxieFields = {
  clientCreate: [
    { key: 'name', kind: 'text', displayName: 'Name', required: true },
    ...CLIENT_DETAIL_FIELDS,
  ] satisfies MoxieFieldSpec[],

  clientUpdate: [
    { key: 'name', kind: 'text', displayName: 'Name' },
    ...CLIENT_DETAIL_FIELDS,
  ] satisfies MoxieFieldSpec[],

  contactCreate: [
    { key: 'first', kind: 'text', displayName: 'First Name', required: true },
    { key: 'last', kind: 'text', displayName: 'Last Name' },
    { key: 'email', kind: 'email', displayName: 'Email' },
    { key: 'phone', kind: 'text', displayName: 'Phone' },
    { key: 'notes', kind: 'longText', displayName: 'Notes' },
    ...CONTACT_FLAG_FIELDS,
  ] satisfies MoxieFieldSpec[],

  contactUpdate: [
    { key: 'firstName', kind: 'text', displayName: 'First Name' },
    { key: 'lastName', kind: 'text', displayName: 'Last Name', clearable: true },
    { key: 'role', kind: 'text', displayName: 'Role', clearable: true },
    { key: 'email', kind: 'email', displayName: 'Email', clearable: true },
    { key: 'phone', kind: 'text', displayName: 'Phone', clearable: true },
    { key: 'mobile', kind: 'text', displayName: 'Mobile', clearable: true },
    { key: 'notes', kind: 'longText', displayName: 'Notes', clearable: true },
    ...CONTACT_FLAG_FIELDS,
  ] satisfies MoxieFieldSpec[],

  projectCreate: [
    { key: 'startDate', kind: 'date', displayName: 'Start Date' },
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
    { key: 'portalAccess', kind: 'enum', displayName: 'Client Portal Access', options: PORTAL_ACCESS_OPTIONS },
    { key: 'showTimeWorkedInPortal', kind: 'triState', displayName: 'Show Time Worked in Portal' },
    { key: 'templateName', kind: 'text', displayName: 'Project Template', description: 'Exact name of a project template to copy tasks and settings from.' },
    { key: 'customValues', kind: 'record', displayName: 'Custom Values', description: 'Custom project field values keyed by field name.' },
  ] satisfies MoxieFieldSpec[],

  projectFee: [
    { key: 'feeType', kind: 'enum', displayName: 'Fee Type', options: FEE_TYPE_OPTIONS, description: 'Sets the fee schedule. Leave empty to create the project without one.' },
    { key: 'amount', kind: 'number', displayName: 'Fee Amount', min: 0, description: 'Hourly rate, fixed price, retainer amount or per-item price, depending on Fee Type.' },
    { key: 'estimateMin', kind: 'number', displayName: 'Estimate Minimum', min: 0 },
    { key: 'estimateMax', kind: 'number', displayName: 'Estimate Maximum', min: 0 },
    { key: 'taxable', kind: 'triState', displayName: 'Fee Taxable' },
  ] satisfies MoxieFieldSpec[],

  projectUpdate: [
    { key: 'name', kind: 'text', displayName: 'Name' },
    { key: 'description', kind: 'longText', displayName: 'Description', clearable: true },
    { key: 'startDate', kind: 'date', displayName: 'Start Date' },
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
    { key: 'active', kind: 'triState', displayName: 'Active', description: 'No marks the project inactive, Yes reactivates it.' },
    { key: 'portalAccess', kind: 'enum', displayName: 'Client Portal Access', options: PORTAL_ACCESS_OPTIONS },
    { key: 'showTimeWorkedInPortal', kind: 'triState', displayName: 'Show Time Worked in Portal' },
    { key: 'hexColor', kind: 'text', displayName: 'Colour', description: 'Hex colour, for example #78909C.' },
  ] satisfies MoxieFieldSpec[],

  taskCreate: [
    { key: 'description', kind: 'longText', displayName: 'Description' },
    { key: 'startDate', kind: 'date', displayName: 'Start Date' },
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
    { key: 'priority', kind: 'integer', displayName: 'Priority', description: 'Whole number used to sort the kanban board.' },
    { key: 'tasks', kind: 'list', displayName: 'Subtasks', description: 'Names of subtasks to add.' },
    { key: 'assignedTo', kind: 'list', displayName: 'Assignee Emails', description: 'Emails of workspace users to assign (see List Workspace Users).' },
    { key: 'customValues', kind: 'record', displayName: 'Custom Values', description: 'Custom task field values keyed by field name.' },
  ] satisfies MoxieFieldSpec[],

  taskUpdate: [
    { key: 'name', kind: 'text', displayName: 'Name' },
    { key: 'description', kind: 'longText', displayName: 'Description', clearable: true },
    { key: 'priority', kind: 'integer', displayName: 'Priority', description: 'Whole number used to sort the kanban board.' },
    { key: 'startDate', kind: 'date', displayName: 'Start Date' },
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
  ] satisfies MoxieFieldSpec[],

  opportunityCreate: [
    { key: 'description', kind: 'longText', displayName: 'Description' },
    { key: 'value', kind: 'number', displayName: 'Estimated Value', min: 0 },
    { key: 'estCloseDate', kind: 'date', displayName: 'Estimated Close Date' },
    { key: 'customValues', kind: 'record', displayName: 'Custom Values', description: 'Custom opportunity field values keyed by field name.' },
  ] satisfies MoxieFieldSpec[],

  opportunityUpdate: [
    { key: 'name', kind: 'text', displayName: 'Name' },
    { key: 'description', kind: 'longText', displayName: 'Description', clearable: true },
    { key: 'value', kind: 'number', displayName: 'Estimated Value', min: 0 },
    { key: 'estCloseDate', kind: 'date', displayName: 'Estimated Close Date' },
    { key: 'actualCloseDate', kind: 'date', displayName: 'Actual Close Date' },
    { key: 'sentiment', kind: 'integer', displayName: 'Sentiment', description: 'Whole number rating of how the deal is going.' },
    { key: 'archive', kind: 'triState', displayName: 'Archived', description: 'Yes archives the opportunity, No restores it.' },
  ] satisfies MoxieFieldSpec[],

  expenseCreate: [
    { key: 'date', kind: 'dateTime', displayName: 'Expense Date' },
    { key: 'category', kind: 'text', displayName: 'Category' },
    { key: 'currency', kind: 'text', displayName: 'Currency', description: 'Three-letter ISO 4217 code, for example USD.' },
    { key: 'paid', kind: 'triState', displayName: 'Paid' },
    { key: 'reimbursable', kind: 'triState', displayName: 'Billable to Client', description: 'Yes marks the expense as reimbursable, so it can be billed to the client.' },
    { key: 'markupPercentage', kind: 'number', displayName: 'Markup Percentage', min: 0 },
    { key: 'billNo', kind: 'text', displayName: 'Bill or Receipt Number' },
    { key: 'description', kind: 'text', displayName: 'Description' },
    { key: 'notes', kind: 'longText', displayName: 'Notes' },
  ] satisfies MoxieFieldSpec[],

  expenseUpdate: [
    { key: 'amount', kind: 'number', displayName: 'Amount', min: 0 },
    { key: 'taxRate', kind: 'number', displayName: 'Tax Rate', min: 0, description: 'Tax rate percentage.' },
    { key: 'category', kind: 'text', displayName: 'Category', clearable: true },
    { key: 'currency', kind: 'text', displayName: 'Currency', description: 'Three-letter ISO 4217 code, for example USD.' },
    { key: 'paid', kind: 'triState', displayName: 'Paid' },
    { key: 'paidDate', kind: 'date', displayName: 'Paid Date' },
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
    { key: 'reimbursable', kind: 'triState', displayName: 'Billable to Client' },
    { key: 'markupPercent', kind: 'number', displayName: 'Markup Percentage', min: 0 },
    { key: 'billNo', kind: 'text', displayName: 'Bill or Receipt Number', clearable: true },
    { key: 'description', kind: 'text', displayName: 'Description', clearable: true },
    { key: 'notes', kind: 'longText', displayName: 'Notes', clearable: true },
    { key: 'clientId', kind: 'id', displayName: 'Client ID', description: 'Client to bill the expense to (from Search Clients).' },
    { key: 'projectId', kind: 'id', displayName: 'Project ID', description: 'Project to file the expense under (from Search Projects).' },
  ] satisfies MoxieFieldSpec[],

  timeEntry: [
    { key: 'notes', kind: 'longText', displayName: 'Notes' },
  ] satisfies MoxieFieldSpec[],

  invoice: [
    { key: 'dueDate', kind: 'date', displayName: 'Due Date' },
    { key: 'taxRate', kind: 'number', displayName: 'Tax Rate', min: 0, description: 'Flat tax rate percentage applied to taxable items.' },
    { key: 'discountPercent', kind: 'number', displayName: 'Discount Percentage', min: 0 },
    { key: 'paymentInstructions', kind: 'longText', displayName: 'Payment Instructions' },
    { key: 'description', kind: 'longText', displayName: 'Description' },
    { key: 'invoiceNumber', kind: 'text', displayName: 'Invoice Number', description: 'Leave empty to use the next number in the sequence.' },
  ] satisfies MoxieFieldSpec[],

  calendarEvent: [
    { key: 'timezone', kind: 'text', displayName: 'Time Zone', description: 'IANA time zone, for example America/New_York.' },
    { key: 'fullDay', kind: 'triState', displayName: 'All Day' },
    { key: 'busy', kind: 'triState', displayName: 'Show as Busy' },
    { key: 'summary', kind: 'text', displayName: 'Title' },
    { key: 'description', kind: 'longText', displayName: 'Description' },
    { key: 'location', kind: 'text', displayName: 'Location' },
    { key: 'userEmail', kind: 'email', displayName: 'Owner Email', description: 'Email of the workspace user who owns the event (see List Workspace Users).' },
  ] satisfies MoxieFieldSpec[],

  formSubmission: [
    { key: 'firstName', kind: 'text', displayName: 'First Name' },
    { key: 'lastName', kind: 'text', displayName: 'Last Name' },
    { key: 'email', kind: 'email', displayName: 'Email' },
    { key: 'phone', kind: 'text', displayName: 'Phone' },
    { key: 'role', kind: 'text', displayName: 'Role' },
    { key: 'businessName', kind: 'text', displayName: 'Business Name' },
    { key: 'website', kind: 'text', displayName: 'Website' },
    { key: 'address1', kind: 'text', displayName: 'Address Line 1' },
    { key: 'address2', kind: 'text', displayName: 'Address Line 2' },
    { key: 'city', kind: 'text', displayName: 'City' },
    { key: 'locality', kind: 'text', displayName: 'State or Region' },
    { key: 'postal', kind: 'text', displayName: 'Postal Code' },
    { key: 'country', kind: 'text', displayName: 'Country' },
    { key: 'taxId', kind: 'text', displayName: 'Tax ID' },
    { key: 'sourceUrl', kind: 'text', displayName: 'Source URL' },
    { key: 'leadSource', kind: 'text', displayName: 'Lead Source' },
    { key: 'pipelineStageName', kind: 'text', displayName: 'Pipeline Stage', description: 'Exact stage label to place the lead in (see List Pipeline Stages).' },
    { key: 'notes', kind: 'longText', displayName: 'Notes' },
  ] satisfies MoxieFieldSpec[],
};
