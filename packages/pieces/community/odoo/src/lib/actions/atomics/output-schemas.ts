import { OutputSchema } from '@activepieces/pieces-framework';
import { odooSchemaFields } from '../../output-schemas';

const f = odooSchemaFields;

const genericPage: OutputSchema = {
  fields: [...f.pageFields, { key: 'records', label: 'Records', labelKey: 'display_name' }],
};

export const atomicSchemas = {
  connectionInfo: {
    fields: [
      { key: 'server_version', label: 'Server Version' },
      { key: 'server_serie', label: 'Server Series', description: 'For example 18.0 or saas~18.3' },
      { key: 'protocol_version', label: 'Protocol Version', format: 'number' },
      { key: 'database', label: 'Database' },
      { key: 'uid', label: 'User ID', format: 'number' },
      { key: 'user_name', label: 'User Name' },
      { key: 'user_login', label: 'User Login' },
      { key: 'user_email', label: 'User Email', format: 'email' },
      { key: 'company_id', label: 'Company ID', format: 'number' },
      { key: 'company_id_name', label: 'Company' },
      { key: 'lang', label: 'Language' },
      { key: 'tz', label: 'Time Zone' },
      { key: 'is_admin', label: 'Is Administrator', format: 'boolean', description: 'true when the user has Settings access; null if Odoo did not say' },
      { key: 'has_contacts', label: 'Contacts Available', format: 'boolean' },
      { key: 'has_crm', label: 'CRM Available', format: 'boolean' },
      { key: 'has_sales', label: 'Sales Available', format: 'boolean' },
      { key: 'has_invoicing', label: 'Invoicing Available', format: 'boolean' },
      { key: 'has_products', label: 'Products Available', format: 'boolean' },
      { key: 'has_project', label: 'Project Available', format: 'boolean' },
      { key: 'has_inventory', label: 'Inventory Available', format: 'boolean' },
      { key: 'installed_apps', label: 'Installed Apps', description: 'Installed application module names; null when this user cannot read the module list' },
    ],
  },
  listModels: {
    fields: [
      ...f.pageFields.filter((field) => field.key !== 'model'),
      {
        key: 'models',
        label: 'Models',
        labelKey: 'model',
        listItems: [
          { key: 'model', label: 'Technical Name' },
          { key: 'name', label: 'Description' },
        ],
      },
    ],
  },
  modelFields: {
    fields: [
      { key: 'model', label: 'Model' },
      { key: 'count', label: 'Count', format: 'number' },
      {
        key: 'fields',
        label: 'Fields',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Field Name' },
          { key: 'label', label: 'Label' },
          { key: 'type', label: 'Type' },
          { key: 'required', label: 'Required', format: 'boolean' },
          { key: 'readonly', label: 'Read Only', format: 'boolean' },
          { key: 'relation', label: 'Related Model' },
          { key: 'selection', label: 'Allowed Values', labelKey: 'value', listItems: [{ key: 'value', label: 'Value' }, { key: 'label', label: 'Label' }] },
          { key: 'help', label: 'Help' },
        ],
      },
    ],
  },
  genericPage,
  genericRecords: {
    fields: [
      { key: 'model', label: 'Model' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'records', label: 'Records', labelKey: 'display_name' },
    ],
  },
  count: {
    fields: [
      { key: 'model', label: 'Model' },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  nameSearch: {
    fields: [
      { key: 'model', label: 'Model' },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean', description: 'true when more records match than the limit' },
      { key: 'results', label: 'Matches', labelKey: 'name', listItems: [{ key: 'id', label: 'ID', format: 'number' }, { key: 'name', label: 'Name' }] },
    ],
  },
  created: {
    fields: [
      { key: 'id', label: 'New Record ID', format: 'number' },
      { key: 'model', label: 'Model' },
      { key: 'display_name', label: 'Display Name' },
      f.readBackField,
    ],
  },
  updated: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'model', label: 'Model' },
      { key: 'ids', label: 'Updated IDs' },
      { key: 'updated_count', label: 'Updated Count', format: 'number' },
    ],
  },
  deleted: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'model', label: 'Model' },
      { key: 'deleted_ids', label: 'Deleted IDs' },
    ],
  },
  download: {
    fields: [
      { key: 'id', label: 'Attachment ID', format: 'number' },
      { key: 'name', label: 'File Name' },
      { key: 'mimetype', label: 'MIME Type' },
      { key: 'file_size', label: 'Size', format: 'filesize' },
      { key: 'type', label: 'Storage Type' },
      { key: 'url', label: 'External URL', format: 'url' },
      { key: 'file', label: 'File', format: 'url' },
    ],
  },
  attachments: f.pageOf({ label: 'Attachments', labelKey: 'name', items: f.attachmentFields }),
  partners: f.pageOf({ label: 'Contacts', labelKey: 'display_name', items: f.partnerFields }),
  leads: f.pageOf({ label: 'Leads', labelKey: 'name', items: f.leadFields }),
  stages: f.pageOf({ label: 'Stages', labelKey: 'name', items: f.stageFields }),
  saleOrders: f.pageOf({ label: 'Sales Orders', labelKey: 'name', items: f.saleOrderFields }),
  invoices: f.pageOf({ label: 'Invoices', labelKey: 'name', items: f.invoiceFields }),
  products: f.pageOf({ label: 'Products', labelKey: 'display_name', items: f.productFields }),
  projects: f.pageOf({ label: 'Projects', labelKey: 'name', items: f.projectFields }),
  tasks: f.pageOf({ label: 'Tasks', labelKey: 'name', items: f.taskFields }),
  users: f.pageOf({ label: 'Users', labelKey: 'name', items: f.userFields }),
  partner: { fields: f.partnerFields },
  lead: { fields: f.leadFields },
  saleOrder: { fields: f.saleOrderFields },
  invoice: { fields: f.invoiceFields },
  product: { fields: f.productFields },
  task: { fields: f.taskFields },
  attachment: { fields: f.attachmentFields },
  createdPartner: { fields: [...f.partnerFields, f.readBackField] },
  createdLead: { fields: [...f.leadFields, f.readBackField] },
  createdSaleOrder: { fields: [...f.saleOrderFields, f.readBackField] },
  createdInvoice: { fields: [...f.invoiceFields, f.readBackField] },
  createdProduct: {
    fields: [
      ...f.productFields,
      {
        ...f.readBackField,
        description:
          'null when the new product was read back. Otherwise why reading it failed: the product was still created. If its variant could not be found, id is null and product_tmpl_id holds the new template ID.',
      },
    ],
  },
  createdTask: { fields: [...f.taskFields, f.readBackField] },
  createdAttachment: { fields: [...f.attachmentFields, f.readBackField] },
} satisfies Record<string, OutputSchema>;
