import { OutputSchema } from '@activepieces/pieces-framework';

const m2o = ({ key, label }: { key: string; label: string }): OutputSchema['fields'] => [
  { key, label: `${label} ID`, format: 'number' },
  { key: `${key}_name`, label },
];

const timestamps: OutputSchema['fields'] = [
  { key: 'create_date', label: 'Created On (UTC)', format: 'datetime' },
  { key: 'write_date', label: 'Last Updated On (UTC)', format: 'datetime' },
];

const partnerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID', format: 'number' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'name', label: 'Name' },
  { key: 'is_company', label: 'Is a Company', format: 'boolean' },
  ...m2o({ key: 'parent_id', label: 'Parent Company' }),
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'mobile', label: 'Mobile', description: 'Removed in Odoo 19; always null there.' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'function', label: 'Job Position' },
  { key: 'ref', label: 'Reference' },
  { key: 'vat', label: 'Tax ID' },
  { key: 'street', label: 'Street' },
  { key: 'street2', label: 'Street 2' },
  { key: 'city', label: 'City' },
  { key: 'zip', label: 'ZIP' },
  ...m2o({ key: 'state_id', label: 'State' }),
  ...m2o({ key: 'country_id', label: 'Country' }),
  { key: 'company_name', label: 'Company Name (free text)' },
  { key: 'lang', label: 'Language' },
  { key: 'active', label: 'Active', format: 'boolean' },
  ...timestamps,
];

const leadFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Lead ID', format: 'number' },
  { key: 'name', label: 'Title' },
  { key: 'type', label: 'Type', description: 'lead or opportunity' },
  { key: 'active', label: 'Active', format: 'boolean', description: 'false when the lead was marked lost' },
  ...m2o({ key: 'stage_id', label: 'Stage' }),
  { key: 'probability', label: 'Probability (%)', format: 'number' },
  { key: 'expected_revenue', label: 'Expected Revenue', format: 'number' },
  ...m2o({ key: 'partner_id', label: 'Customer' }),
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'partner_name', label: 'Company Name' },
  { key: 'email_from', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  ...m2o({ key: 'user_id', label: 'Salesperson' }),
  ...m2o({ key: 'team_id', label: 'Sales Team' }),
  { key: 'tag_ids', label: 'Tag IDs' },
  { key: 'priority', label: 'Priority', description: '"0" (normal) to "3" (very high)' },
  { key: 'date_deadline', label: 'Expected Closing', format: 'date' },
  ...m2o({ key: 'lost_reason_id', label: 'Lost Reason' }),
  { key: 'won_status', label: 'Won Status', description: 'won, lost or pending; null on Odoo versions without this field (for example 18)' },
  ...timestamps,
];

const stageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Stage ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'sequence', label: 'Sequence', format: 'number' },
  { key: 'is_won', label: 'Is Won Stage', format: 'boolean' },
  { key: 'fold', label: 'Folded', format: 'boolean' },
  { key: 'team_ids', label: 'Sales Team IDs', description: 'Empty = shared by all teams' },
];

const saleOrderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Order ID', format: 'number' },
  { key: 'name', label: 'Order Reference' },
  { key: 'state', label: 'Status', description: 'draft, sent, sale, cancel (and done on Odoo 16)' },
  ...m2o({ key: 'partner_id', label: 'Customer' }),
  { key: 'date_order', label: 'Order Date (UTC)', format: 'datetime' },
  { key: 'validity_date', label: 'Expiration', format: 'date' },
  { key: 'client_order_ref', label: 'Customer Reference' },
  { key: 'amount_untaxed', label: 'Untaxed Amount', format: 'number' },
  { key: 'amount_tax', label: 'Taxes', format: 'number' },
  { key: 'amount_total', label: 'Total', format: 'number' },
  ...m2o({ key: 'currency_id', label: 'Currency' }),
  ...m2o({ key: 'user_id', label: 'Salesperson' }),
  { key: 'invoice_status', label: 'Invoice Status' },
  ...timestamps,
];

const invoiceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Invoice ID', format: 'number' },
  { key: 'name', label: 'Number', description: 'null on Odoo 18 and later while the invoice is a draft; on Odoo 17 and older a draft can already carry its number (or "/")' },
  { key: 'move_type', label: 'Type', description: 'out_invoice, in_invoice, out_refund, in_refund' },
  { key: 'state', label: 'Status', description: 'draft, posted, cancel' },
  { key: 'payment_state', label: 'Payment Status' },
  ...m2o({ key: 'partner_id', label: 'Partner' }),
  { key: 'invoice_date', label: 'Invoice Date', format: 'date' },
  { key: 'invoice_date_due', label: 'Due Date', format: 'date' },
  { key: 'ref', label: 'Reference' },
  { key: 'payment_reference', label: 'Payment Reference' },
  { key: 'invoice_origin', label: 'Source Document' },
  { key: 'amount_untaxed', label: 'Untaxed Amount', format: 'number' },
  { key: 'amount_tax', label: 'Taxes', format: 'number' },
  { key: 'amount_total', label: 'Total', format: 'number' },
  { key: 'amount_residual', label: 'Amount Due', format: 'number' },
  ...m2o({ key: 'currency_id', label: 'Currency' }),
  ...timestamps,
];

const productFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Product Variant ID', format: 'number' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'name', label: 'Name' },
  { key: 'default_code', label: 'Internal Reference' },
  { key: 'barcode', label: 'Barcode' },
  { key: 'lst_price', label: 'Sales Price', format: 'number' },
  { key: 'standard_price', label: 'Cost', format: 'number' },
  { key: 'type', label: 'Product Type' },
  { key: 'detailed_type', label: 'Detailed Type (Odoo 16/17)' },
  { key: 'is_storable', label: 'Track Inventory (Odoo 18+)', format: 'boolean' },
  { key: 'sale_ok', label: 'Can Be Sold', format: 'boolean' },
  { key: 'purchase_ok', label: 'Can Be Purchased', format: 'boolean' },
  ...m2o({ key: 'uom_id', label: 'Unit of Measure' }),
  ...m2o({ key: 'categ_id', label: 'Category' }),
  ...m2o({ key: 'product_tmpl_id', label: 'Product Template' }),
  { key: 'active', label: 'Active', format: 'boolean' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'name', label: 'Name' },
  ...m2o({ key: 'partner_id', label: 'Customer' }),
  ...m2o({ key: 'user_id', label: 'Project Manager' }),
  { key: 'date_start', label: 'Start Date', format: 'date' },
  { key: 'date', label: 'End Date', format: 'date' },
  { key: 'task_count', label: 'Task Count', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'create_date', label: 'Created On (UTC)', format: 'datetime' },
];

const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID', format: 'number' },
  { key: 'name', label: 'Title' },
  ...m2o({ key: 'project_id', label: 'Project' }),
  ...m2o({ key: 'stage_id', label: 'Stage' }),
  { key: 'user_ids', label: 'Assignee User IDs' },
  { key: 'date_deadline', label: 'Deadline', description: 'Date on Odoo 16, UTC datetime on 17+' },
  { key: 'priority', label: 'Priority', description: '"0" normal, "1" high' },
  { key: 'state', label: 'State (Odoo 17+)' },
  { key: 'kanban_state', label: 'Kanban State (Odoo 16)' },
  { key: 'tag_ids', label: 'Tag IDs' },
  ...m2o({ key: 'parent_id', label: 'Parent Task' }),
  ...m2o({ key: 'partner_id', label: 'Customer' }),
  ...timestamps,
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'login', label: 'Login' },
  { key: 'email', label: 'Email', format: 'email' },
  ...m2o({ key: 'partner_id', label: 'Related Contact' }),
  { key: 'active', label: 'Active', format: 'boolean' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID', format: 'number' },
  { key: 'name', label: 'File Name' },
  { key: 'mimetype', label: 'MIME Type' },
  { key: 'file_size', label: 'Size', format: 'filesize' },
  { key: 'res_model', label: 'Attached To Model' },
  { key: 'res_id', label: 'Attached To Record ID', format: 'number' },
  { key: 'type', label: 'Storage Type', description: 'binary or url' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'create_date', label: 'Created On (UTC)', format: 'datetime' },
];

const pageFields: OutputSchema['fields'] = [
  { key: 'model', label: 'Model' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'offset', label: 'Offset', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
  { key: 'next_offset', label: 'Next Offset', format: 'number' },
];

function pageOf({ label, labelKey, items }: { label: string; labelKey: string; items: OutputSchema['fields'] }): OutputSchema {
  return { fields: [...pageFields, { key: 'records', label, labelKey, listItems: items }] };
}

export const createRecordOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'New Record ID', format: 'number' }],
};

export const updateRecordOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const partnerOutputSchema: OutputSchema = { fields: partnerFields };
export const leadOutputSchema: OutputSchema = { fields: leadFields };
export const saleOrderOutputSchema: OutputSchema = { fields: saleOrderFields };
export const invoiceOutputSchema: OutputSchema = { fields: invoiceFields };
export const productOutputSchema: OutputSchema = { fields: productFields };
export const taskOutputSchema: OutputSchema = { fields: taskFields };
export const attachmentOutputSchema: OutputSchema = { fields: attachmentFields };

export const findInvoicesOutputSchema: OutputSchema = pageOf({ label: 'Invoices', labelKey: 'name', items: invoiceFields });

export const getRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'id', label: 'Record ID', format: 'number' },
    { key: 'record', label: 'Record' },
  ],
};

export const deleteRecordOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'model', label: 'Model' },
    { key: 'deleted_id', label: 'Deleted Record ID', format: 'number' },
  ],
};

export const runMethodOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'method', label: 'Method' },
    { key: 'record_ids', label: 'Record IDs' },
    { key: 'returned_none', label: 'Method Returned Nothing', format: 'boolean', description: 'true when the method ran but had no return value' },
    { key: 'result', label: 'Result' },
  ],
};

export const postMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'message_id', label: 'Message ID', format: 'number' },
    { key: 'model', label: 'Model' },
    { key: 'record_id', label: 'Record ID', format: 'number' },
    { key: 'message_type', label: 'Posted As', description: 'note or message' },
  ],
};

export const odooSchemaFields = {
  partnerFields,
  leadFields,
  stageFields,
  saleOrderFields,
  invoiceFields,
  productFields,
  projectFields,
  taskFields,
  userFields,
  attachmentFields,
  pageFields,
  pageOf,
};
