import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../../common/auth';
import { invoiceNinjaClient } from '../../common/client';
import { entityActions } from '../../common/entity-actions';
import { invoiceNinjaOutputSchemas } from '../../common/output-schemas';

export const getExpense = createAction({
  auth: invoiceninjaAuth,
  name: 'get_expense',
  classification: 'READ',
  displayName: 'Get Expense',
  description: 'Get one expense by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja expense by ID: amount, date, vendor, client, project and whether it should be invoiced. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.expense,
  props: { id: entityActions.getIdProp('Expense') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'expenses', label: 'Expense', id: propsValue.id });
  },
});

export const listExpenses = createAction({
  auth: invoiceninjaAuth,
  name: 'list_expenses',
  classification: 'SEARCH',
  displayName: 'List Expenses',
  description: 'List expenses, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja expenses, optionally for one client or vendor and by free-text search. Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.expenseList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    vendor_id: Property.ShortText({ displayName: 'Vendor ID', required: false }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    sort: entityActions.sortProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'expenses',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        vendor_id: invoiceNinjaClient.optionalId({ value: propsValue.vendor_id, label: 'Vendor ID' }),
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
        sort: propsValue.sort,
      },
    });
  },
});

export const createExpense = createAction({
  auth: invoiceninjaAuth,
  name: 'create_expense',
  classification: 'WRITE',
  displayName: 'Create Expense',
  description: 'Record an expense, optionally for a client, vendor or project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Records an Invoice Ninja expense of amount on date (YYYY-MM-DD, default today), optionally linked to a vendor, a client and a project, with should_be_invoiced to bill it to the client later. Not idempotent.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.expense,
  props: {
    amount: Property.Number({ displayName: 'Amount', required: true }),
    date: Property.ShortText({ displayName: 'Date', description: 'YYYY-MM-DD. Default today.', required: false }),
    vendor_id: Property.ShortText({ displayName: 'Vendor ID', required: false }),
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    project_id: Property.ShortText({ displayName: 'Project ID', required: false }),
    category_id: Property.ShortText({ displayName: 'Expense Category ID', required: false }),
    should_be_invoiced: Property.Checkbox({ displayName: 'Should Be Invoiced', required: false }),
    transaction_reference: Property.ShortText({ displayName: 'Transaction Reference', required: false }),
    public_notes: Property.LongText({ displayName: 'Public Notes', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    const amount = invoiceNinjaClient.optionalNumber({ value: propsValue.amount, label: 'Amount', min: 0 });
    if (amount === undefined) throw new Error('Amount is required.');
    const body = invoiceNinjaClient.compact({
      amount,
      date: invoiceNinjaClient.toDateOnly({ value: propsValue.date, label: 'Date' }) ?? new Date().toISOString().slice(0, 10),
      vendor_id: invoiceNinjaClient.optionalId({ value: propsValue.vendor_id, label: 'Vendor ID' }),
      client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
      project_id: invoiceNinjaClient.optionalId({ value: propsValue.project_id, label: 'Project ID' }),
      category_id: invoiceNinjaClient.optionalId({ value: propsValue.category_id, label: 'Expense Category ID' }),
      should_be_invoiced: invoiceNinjaClient.parseBoolean(propsValue.should_be_invoiced),
      transaction_reference: invoiceNinjaClient.optionalText(propsValue.transaction_reference),
      public_notes: invoiceNinjaClient.optionalText(propsValue.public_notes),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/expenses', body }),
    );
  },
});

export const getProject = createAction({
  auth: invoiceninjaAuth,
  name: 'get_project',
  classification: 'READ',
  displayName: 'Get Project',
  description: 'Get one project by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja project by ID: name, client, task rate, budgeted hours and due date. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.project,
  props: { id: entityActions.getIdProp('Project') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'projects', label: 'Project', id: propsValue.id });
  },
});

export const listProjects = createAction({
  auth: invoiceninjaAuth,
  name: 'list_projects',
  classification: 'SEARCH',
  displayName: 'List Projects',
  description: 'List projects, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja projects, optionally for one client and by free-text search on the name. Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.projectList,
  props: {
    client_id: Property.ShortText({ displayName: 'Client ID', required: false }),
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'projects',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: {
        client_id: invoiceNinjaClient.optionalId({ value: propsValue.client_id, label: 'Client ID' }),
        filter: invoiceNinjaClient.optionalText(propsValue.search),
        status: propsValue.status,
      },
    });
  },
});

export const createProject = createAction({
  auth: invoiceninjaAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a project for a client.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Invoice Ninja project named name for client_id, with optional hourly task_rate, budgeted_hours and due_date (YYYY-MM-DD). Tasks can then be logged against it. Not idempotent.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.project,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    client_id: Property.ShortText({ displayName: 'Client ID', required: true }),
    task_rate: Property.Number({ displayName: 'Task Rate', description: 'Hourly rate for tasks of this project.', required: false }),
    budgeted_hours: Property.Number({ displayName: 'Budgeted Hours', required: false }),
    due_date: Property.ShortText({ displayName: 'Due Date', description: 'YYYY-MM-DD.', required: false }),
    public_notes: Property.LongText({ displayName: 'Public Notes', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    const name = invoiceNinjaClient.optionalText(propsValue.name);
    if (name === undefined) throw new Error('Name is required.');
    const body = invoiceNinjaClient.compact({
      name,
      client_id: invoiceNinjaClient.parseId({ value: propsValue.client_id, label: 'Client ID' }),
      task_rate: invoiceNinjaClient.optionalNumber({ value: propsValue.task_rate, label: 'Task Rate', min: 0 }),
      budgeted_hours: invoiceNinjaClient.optionalNumber({ value: propsValue.budgeted_hours, label: 'Budgeted Hours', min: 0 }),
      due_date: invoiceNinjaClient.toDateOnly({ value: propsValue.due_date, label: 'Due Date' }),
      public_notes: invoiceNinjaClient.optionalText(propsValue.public_notes),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/projects', body }),
    );
  },
});

export const getVendor = createAction({
  auth: invoiceninjaAuth,
  name: 'get_vendor',
  classification: 'READ',
  displayName: 'Get Vendor',
  description: 'Get one vendor by its ID.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one Invoice Ninja vendor (supplier) by ID with address and contacts. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.vendor,
  props: { id: entityActions.getIdProp('Vendor') },
  async run({ auth, propsValue }) {
    return entityActions.runGet({ auth: auth.props, entity: 'vendors', label: 'Vendor', id: propsValue.id });
  },
});

export const listVendors = createAction({
  auth: invoiceninjaAuth,
  name: 'list_vendors',
  classification: 'SEARCH',
  displayName: 'List Vendors',
  description: 'List or search vendors, one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists Invoice Ninja vendors (suppliers); search matches name, number and contacts. Returns {items, page, perPage, total, hasMore}. Read-only.',
    idempotent: true,
  },
  outputSchema: invoiceNinjaOutputSchemas.vendorList,
  props: {
    search: Property.ShortText({ displayName: 'Search', required: false }),
    status: entityActions.statusProp(),
    ...entityActions.listProps(),
  },
  async run({ auth, propsValue }) {
    return entityActions.runList({
      auth: auth.props,
      entity: 'vendors',
      page: propsValue.page,
      perPage: propsValue.per_page,
      query: { filter: invoiceNinjaClient.optionalText(propsValue.search), status: propsValue.status },
    });
  },
});

export const createVendor = createAction({
  auth: invoiceninjaAuth,
  name: 'create_vendor',
  classification: 'WRITE',
  displayName: 'Create Vendor',
  description: 'Create a vendor (supplier) with an optional contact.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates an Invoice Ninja vendor (supplier) named name with optional address, website, VAT number and one contact (contact_first_name, contact_last_name, contact_email, contact_phone). Not idempotent.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.vendor,
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    website: Property.ShortText({ displayName: 'Website', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    vat_number: Property.ShortText({ displayName: 'VAT Number', required: false }),
    address1: Property.ShortText({ displayName: 'Address Line 1', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    postal_code: Property.ShortText({ displayName: 'Postal Code', required: false }),
    contact_first_name: Property.ShortText({ displayName: 'Contact First Name', required: false }),
    contact_last_name: Property.ShortText({ displayName: 'Contact Last Name', required: false }),
    contact_email: Property.ShortText({ displayName: 'Contact Email', required: false }),
    contact_phone: Property.ShortText({ displayName: 'Contact Phone', required: false }),
    private_notes: Property.LongText({ displayName: 'Private Notes', required: false }),
  },
  async run({ auth, propsValue }) {
    const name = invoiceNinjaClient.optionalText(propsValue.name);
    if (name === undefined) throw new Error('Name is required.');
    const contact = invoiceNinjaClient.compact({
      first_name: invoiceNinjaClient.optionalText(propsValue.contact_first_name),
      last_name: invoiceNinjaClient.optionalText(propsValue.contact_last_name),
      email: invoiceNinjaClient.optionalText(propsValue.contact_email),
      phone: invoiceNinjaClient.optionalText(propsValue.contact_phone),
    });
    const body = invoiceNinjaClient.compact({
      name,
      website: invoiceNinjaClient.optionalText(propsValue.website),
      phone: invoiceNinjaClient.optionalText(propsValue.phone),
      vat_number: invoiceNinjaClient.optionalText(propsValue.vat_number),
      address1: invoiceNinjaClient.optionalText(propsValue.address1),
      city: invoiceNinjaClient.optionalText(propsValue.city),
      postal_code: invoiceNinjaClient.optionalText(propsValue.postal_code),
      private_notes: invoiceNinjaClient.optionalText(propsValue.private_notes),
      contacts: Object.keys(contact).length === 0 ? undefined : [contact],
    });
    return invoiceNinjaClient.recordOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/vendors', body }),
    );
  },
});
