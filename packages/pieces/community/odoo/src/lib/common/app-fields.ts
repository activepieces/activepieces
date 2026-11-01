const partner = {
  model: 'res.partner',
  fields: [
    'id', 'display_name', 'name', 'is_company', 'parent_id', 'email', 'phone', 'mobile', 'website', 'function',
    'ref', 'vat', 'street', 'street2', 'city', 'zip', 'state_id', 'country_id', 'company_name', 'lang',
    'active', 'create_date', 'write_date',
  ],
  manyToOne: ['parent_id', 'state_id', 'country_id'],
};

const lead = {
  model: 'crm.lead',
  fields: [
    'id', 'name', 'type', 'active', 'stage_id', 'probability', 'expected_revenue', 'partner_id', 'contact_name',
    'partner_name', 'email_from', 'phone', 'user_id', 'team_id', 'tag_ids', 'priority', 'date_deadline',
    'lost_reason_id', 'won_status', 'create_date', 'write_date',
  ],
  manyToOne: ['stage_id', 'partner_id', 'user_id', 'team_id', 'lost_reason_id'],
};

const stage = {
  model: 'crm.stage',
  fields: ['id', 'name', 'sequence', 'is_won', 'fold', 'team_id', 'team_ids'],
  manyToOne: ['team_id'],
};

const saleOrder = {
  model: 'sale.order',
  fields: [
    'id', 'name', 'state', 'partner_id', 'date_order', 'validity_date', 'client_order_ref', 'amount_untaxed',
    'amount_tax', 'amount_total', 'currency_id', 'user_id', 'invoice_status', 'create_date', 'write_date',
  ],
  manyToOne: ['partner_id', 'currency_id', 'user_id'],
};

const invoice = {
  model: 'account.move',
  fields: [
    'id', 'name', 'move_type', 'state', 'payment_state', 'partner_id', 'invoice_date', 'invoice_date_due', 'ref',
    'payment_reference', 'invoice_origin', 'amount_untaxed', 'amount_tax', 'amount_total', 'amount_residual',
    'currency_id', 'create_date', 'write_date',
  ],
  manyToOne: ['partner_id', 'currency_id'],
};

const product = {
  model: 'product.product',
  fields: [
    'id', 'display_name', 'name', 'default_code', 'barcode', 'lst_price', 'standard_price', 'type', 'detailed_type',
    'is_storable', 'sale_ok', 'purchase_ok', 'uom_id', 'categ_id', 'product_tmpl_id', 'active',
  ],
  manyToOne: ['uom_id', 'categ_id', 'product_tmpl_id'],
};

const project = {
  model: 'project.project',
  fields: ['id', 'name', 'partner_id', 'user_id', 'date_start', 'date', 'task_count', 'active', 'create_date'],
  manyToOne: ['partner_id', 'user_id'],
};

const task = {
  model: 'project.task',
  fields: [
    'id', 'name', 'project_id', 'stage_id', 'user_ids', 'date_deadline', 'priority', 'state', 'kanban_state',
    'tag_ids', 'parent_id', 'partner_id', 'create_date', 'write_date',
  ],
  manyToOne: ['project_id', 'stage_id', 'parent_id', 'partner_id'],
};

const user = {
  model: 'res.users',
  fields: ['id', 'name', 'login', 'email', 'partner_id', 'active'],
  manyToOne: ['partner_id'],
};

const attachment = {
  model: 'ir.attachment',
  fields: ['id', 'name', 'mimetype', 'file_size', 'res_model', 'res_id', 'type', 'url', 'create_date'],
  manyToOne: [],
};

const appProbes: { key: string; label: string; model: string }[] = [
  { key: 'has_contacts', label: 'Contacts', model: 'res.partner' },
  { key: 'has_crm', label: 'CRM', model: 'crm.lead' },
  { key: 'has_sales', label: 'Sales', model: 'sale.order' },
  { key: 'has_invoicing', label: 'Invoicing', model: 'account.move' },
  { key: 'has_products', label: 'Products', model: 'product.product' },
  { key: 'has_project', label: 'Project', model: 'project.task' },
  { key: 'has_inventory', label: 'Inventory', model: 'stock.picking' },
];

export const odooApps = {
  partner,
  lead,
  stage,
  saleOrder,
  invoice,
  product,
  project,
  task,
  user,
  attachment,
  appProbes,
};

export type OdooAppSpec = { model: string; fields: string[]; manyToOne: string[] };
