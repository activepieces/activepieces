import { Property } from '@activepieces/pieces-framework';
import { NinjaPipeAuth } from './types';
import { ninjapipeApiRequest } from './client';
import { extractItems } from './helpers';
import { COUNTRIES, STATES_DE, STATES_AT, STATES_CH, CURRENCIES, DEAL_STATUS, TASK_PRIORITY } from './constants';

export {
  getContactProps,
  getCompanyProps,
  getDealProps,
  getTaskProps,
  getProjectProps,
  getProductProps,
  getBudgetProps,
  getPipelineItemProps,
  getInvoiceProps,
  getOrderProps,
  getListProps,
  getPipelineProps,
  getGenericProps,
  getListFilterProps,
};

export function getContactProps() {
  return {
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'e.g. Mr., Ms., Dr.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    mobile: Property.ShortText({
      displayName: 'Mobile',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Job title',
      required: false,
    }),
    company_name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP / Postal Code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      required: false,
      options: { options: COUNTRIES },
    }),
    state_de: Property.StaticDropdown({
      displayName: 'State (Germany)',
      required: false,
      options: { options: STATES_DE },
    }),
    state_at: Property.StaticDropdown({
      displayName: 'State (Austria)',
      required: false,
      options: { options: STATES_AT },
    }),
    state_ch: Property.StaticDropdown({
      displayName: 'Canton (Switzerland)',
      required: false,
      options: { options: STATES_CH },
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
    lead_source: Property.ShortText({
      displayName: 'Lead Source',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    language: Property.ShortText({
      displayName: 'Language',
      required: false,
    }),
    newsletter: Property.Checkbox({
      displayName: 'Newsletter',
      required: false,
      defaultValue: false,
    }),
  };
}

export function getCompanyProps() {
  return {
    name: Property.ShortText({
      displayName: 'Company Name',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      required: false,
    }),
    industry: Property.ShortText({
      displayName: 'Industry',
      required: false,
    }),
    employees: Property.Number({
      displayName: 'Number of Employees',
      required: false,
    }),
    annual_revenue: Property.Number({
      displayName: 'Annual Revenue',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    street: Property.ShortText({
      displayName: 'Street',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'ZIP / Postal Code',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: Property.StaticDropdown({
      displayName: 'Country',
      required: false,
      options: { options: COUNTRIES },
    }),
    state_de: Property.StaticDropdown({
      displayName: 'State (Germany)',
      required: false,
      options: { options: STATES_DE },
    }),
    state_at: Property.StaticDropdown({
      displayName: 'State (Austria)',
      required: false,
      options: { options: STATES_AT },
    }),
    state_ch: Property.StaticDropdown({
      displayName: 'Canton (Switzerland)',
      required: false,
      options: { options: STATES_CH },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
  };
}

export async function getDealProps(auth: NinjaPipeAuth) {
  const pipelines = await loadPipelines(auth);

  return {
    title: Property.ShortText({
      displayName: 'Deal Title',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Associated company ID',
      required: false,
    }),
    pipeline_id: Property.StaticDropdown({
      displayName: 'Pipeline',
      required: false,
      options: { options: pipelines },
    }),
    stage_id: Property.DynamicDropdown({
      displayName: 'Stage',
      description: 'Pipeline stage - select a pipeline first to load stages',
      required: false,
      refreshers: ['pipeline_id'],
      options: async ({ pipeline_id }) => {
        if (!pipeline_id) {
          return { options: [{ label: 'Select a pipeline first', value: '' }] };
        }
        try {
          const stages = await loadPipelineStages(auth, pipeline_id as string);
          if (stages.length === 0) {
            return { options: [{ label: 'No stages found', value: '' }] };
          }
          return { options: stages };
        } catch {
          return { options: [{ label: 'Failed to load stages', value: '' }] };
        }
      },
    }),
    value: Property.Number({
      displayName: 'Deal Value',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: { options: DEAL_STATUS },
    }),
    expected_close_date: Property.ShortText({
      displayName: 'Expected Close Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    probability: Property.Number({
      displayName: 'Probability (%)',
      description: 'Win probability percentage',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  };
}

export async function getTaskProps(auth: NinjaPipeAuth) {
  const projects = await loadProjects(auth);

  return {
    title: Property.ShortText({
      displayName: 'Task Title',
      required: true,
    }),
    project_id: Property.StaticDropdown({
      displayName: 'Project',
      required: false,
      options: { options: projects },
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'Associated deal ID',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      options: { options: TASK_PRIORITY },
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  };
}

export function getProjectProps() {
  return {
    name: Property.ShortText({
      displayName: 'Project Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    budget: Property.Number({
      displayName: 'Budget',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
  };
}

export function getProductProps() {
  return {
    name: Property.ShortText({
      displayName: 'Product Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Stock keeping unit',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    unit: Property.ShortText({
      displayName: 'Unit',
      description: 'e.g. piece, kg, hour',
      required: false,
    }),
    active: Property.Checkbox({
      displayName: 'Active',
      required: false,
      defaultValue: true,
    }),
  };
}

export function getBudgetProps() {
  return {
    name: Property.ShortText({
      displayName: 'Budget Name',
      required: false,
    }),
    amount: Property.Number({
      displayName: 'Amount',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    start_date: Property.ShortText({
      displayName: 'Start Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    end_date: Property.ShortText({
      displayName: 'End Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
  };
}

export async function getPipelineItemProps(auth: NinjaPipeAuth) {
  const pipelines = await loadPipelines(auth);

  return {
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    pipeline_id: Property.StaticDropdown({
      displayName: 'Pipeline',
      required: false,
      options: { options: pipelines },
    }),
    stage_id: Property.ShortText({
      displayName: 'Stage ID',
      description: 'Pipeline stage ID',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Associated company ID',
      required: false,
    }),
    deal_id: Property.ShortText({
      displayName: 'Deal ID',
      description: 'Associated deal ID',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      required: false,
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
  };
}

export async function getInvoiceProps(auth: NinjaPipeAuth) {
  const contacts = await loadContacts(auth);
  const companies = await loadCompanies(auth);

  return {
    invoice_number: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'Unique invoice number (auto-generated if not provided)',
      required: false,
    }),
    contact_id: Property.StaticDropdown({
      displayName: 'Contact',
      required: false,
      options: { options: contacts },
    }),
    company_id: Property.StaticDropdown({
      displayName: 'Company',
      required: false,
      options: { options: companies },
    }),
    issue_date: Property.ShortText({
      displayName: 'Issue Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'YYYY-MM-DD format',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'draft' },
          { label: 'Sent', value: 'sent' },
          { label: 'Paid', value: 'paid' },
          { label: 'Overdue', value: 'overdue' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    subtotal: Property.Number({
      displayName: 'Subtotal',
      required: false,
    }),
    tax: Property.Number({
      displayName: 'Tax Amount',
      required: false,
    }),
    total: Property.Number({
      displayName: 'Total',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  };
}

export function getOrderProps() {
  return {
    order_number: Property.ShortText({
      displayName: 'Order Number',
      description: 'Unique order number (auto-generated if not provided)',
      required: false,
    }),
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Associated contact ID',
      required: false,
    }),
    company_id: Property.ShortText({
      displayName: 'Company ID',
      description: 'Associated company ID',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'Shipped', value: 'shipped' },
          { label: 'Delivered', value: 'delivered' },
          { label: 'Cancelled', value: 'cancelled' },
        ],
      },
    }),
    subtotal: Property.Number({
      displayName: 'Subtotal',
      required: false,
    }),
    tax: Property.Number({
      displayName: 'Tax Amount',
      required: false,
    }),
    total: Property.Number({
      displayName: 'Total',
      required: false,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: false,
      options: { options: CURRENCIES },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
    }),
  };
}

export function getListProps() {
  return {
    name: Property.ShortText({
      displayName: 'List Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Static', value: 'static' },
          { label: 'Dynamic', value: 'dynamic' },
        ],
      },
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
  };
}

export function getPipelineProps() {
  return {
    name: Property.ShortText({
      displayName: 'Pipeline Name',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: false,
      options: {
        options: [
          { label: 'Contacts', value: 'contacts' },
          { label: 'Deals', value: 'deals' },
          { label: 'General', value: 'general' },
        ],
      },
    }),
    owner_id: Property.ShortText({
      displayName: 'Owner ID',
      description: 'User ID of the owner',
      required: false,
    }),
  };
}

export function getGenericProps() {
  return {
    rawBodyJson: Property.Json({
      displayName: 'Request Body (JSON)',
      description: 'Complete request body as JSON object',
      required: false,
    }),
  };
}

export function getListFilterProps() {
  return {
    returnAll: Property.Checkbox({
      displayName: 'Return All',
      description: 'Return all results through pagination',
      required: false,
      defaultValue: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number (default: 1)',
      required: false,
      defaultValue: 1,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results per page (default: 100)',
      required: false,
      defaultValue: 100,
    }),
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Search query',
      required: false,
    }),
    statusFilter: Property.ShortText({
      displayName: 'Status Filter',
      required: false,
    }),
    ownerFilter: Property.ShortText({
      displayName: 'Owner Filter',
      description: 'Filter by owner ID',
      required: false,
    }),
    queryParams: Property.Array({
      displayName: 'Query Parameters',
      required: false,
      properties: {
        field: Property.ShortText({ displayName: 'Field Name', required: true }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          required: true,
          options: {
            options: [
              { label: 'String', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
              { label: 'Null', value: 'null' },
            ],
          },
        }),
        value: Property.ShortText({ displayName: 'Value', required: true }),
      },
    }),
    advancedQueryJson: Property.Json({
      displayName: 'Advanced Query (JSON)',
      description: 'Complex query as JSON object',
      required: false,
    }),
  };
}

async function loadPipelines(auth: NinjaPipeAuth) {
  try {
    const response = await ninjapipeApiRequest(auth, 'GET', '/pipelines', undefined, { page: 1, limit: 100 });
    const items = extractItems(response);
    return items.map((p: Record<string, unknown>) => ({
      label: String(p.name || p.id),
      value: String(p.id),
    }));
  } catch {
    return [];
  }
}

async function loadPipelineStages(auth: NinjaPipeAuth, pipelineId: string) {
  try {
    const response = await ninjapipeApiRequest(auth, 'GET', `/pipelines/${pipelineId}`, undefined, { page: 1, limit: 100 });
    const pipeline = response as Record<string, unknown>;
    const stages = pipeline.stages as Array<Record<string, unknown>> | undefined;
    if (!stages || stages.length === 0) {
      return [];
    }
    return stages.map((s: Record<string, unknown>) => ({
      label: String(s.name || s.id),
      value: String(s.id),
    }));
  } catch {
    return [];
  }
}

async function loadProjects(auth: NinjaPipeAuth) {
  try {
    const response = await ninjapipeApiRequest(auth, 'GET', '/projects', undefined, { page: 1, limit: 100 });
    const items = extractItems(response);
    return items.map((p: Record<string, unknown>) => ({
      label: String(p.name || p.id),
      value: String(p.id),
    }));
  } catch {
    return [];
  }
}

async function loadContacts(auth: NinjaPipeAuth) {
  try {
    const response = await ninjapipeApiRequest(auth, 'GET', '/contacts', undefined, { page: 1, limit: 100 });
    const items = extractItems(response);
    return items.map((c: Record<string, unknown>) => ({
      label: `${c.first_name || ''} ${c.last_name || ''} (${c.email || c.id})`.trim(),
      value: String(c.id),
    }));
  } catch {
    return [];
  }
}

async function loadCompanies(auth: NinjaPipeAuth) {
  try {
    const response = await ninjapipeApiRequest(auth, 'GET', '/companies', undefined, { page: 1, limit: 100 });
    const items = extractItems(response);
    return items.map((c: Record<string, unknown>) => ({
      label: String(c.name || c.id),
      value: String(c.id),
    }));
  } catch {
    return [];
  }
}
