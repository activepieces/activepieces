import { DropdownState, Property } from '@activepieces/pieces-framework';
import { odooAuth } from '../auth';
import { OdooAuthProps, OdooClient, odooRpc } from './client';
import { Domain } from './values';

async function loadModels({ auth, searchValue }: { auth: OdooAuthProps; searchValue?: string }): Promise<DropdownState<string>> {
  const client = OdooClient.fromAuth({ auth });
  const query = (searchValue ?? '').trim();
  const domain: Domain = query
    ? ['&', ['transient', '=', false], '|', ['model', 'ilike', query], ['name', 'ilike', query]]
    : [['transient', '=', false]];
  try {
    const rows = await client.call<{ model: string; name: string }[]>({
      model: 'ir.model',
      method: 'search_read',
      args: [domain],
      kwargs: { fields: ['model', 'name'], order: 'name asc', limit: 200 },
    });
    return {
      disabled: false,
      options: rows.map((row) => ({ label: `${row.name} (${row.model})`, value: row.model })),
    };
  } catch (error) {
    if (!odooRpc.isAccessFault(error)) throw error;
    const filtered = COMMON_MODELS.filter(
      (m) => !query || m.model.includes(query.toLowerCase()) || m.name.toLowerCase().includes(query.toLowerCase()),
    );
    return {
      disabled: false,
      placeholder: 'Your Odoo user cannot list all models, so only common ones are shown.',
      options: filtered.map((m) => ({ label: `${m.name} (${m.model})`, value: m.model })),
    };
  }
}

async function nameSearch({
  auth,
  model,
  searchValue,
  domain = [],
}: {
  auth: OdooAuthProps;
  model: string;
  searchValue?: string;
  domain?: Domain;
}): Promise<DropdownState<number>> {
  const client = OdooClient.fromAuth({ auth });
  const rows = await client.call<[number, string][]>({
    model,
    method: 'name_search',
    args: [searchValue ?? '', domain, 'ilike', 100],
  });
  return {
    disabled: false,
    options: rows.map(([id, name]) => ({ label: `${name} (#${id})`, value: id })),
  };
}

function disabled(placeholder: string): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

async function safely<T>({ load }: { load: () => Promise<DropdownState<T>> }): Promise<DropdownState<T>> {
  try {
    return await load();
  } catch (error) {
    return disabled(`Could not load options: ${odooRpc.describeError(error)}`);
  }
}

function modelDropdown({ displayName = 'Model', description }: { displayName?: string; description?: string } = {}) {
  return Property.Dropdown({
    auth: odooAuth,
    displayName,
    description:
      description ??
      'The kind of record. Type to search, for example "contact" or "sale". Admin users see every model; other users see the common ones.',
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return disabled('Please connect your Odoo account first');
      return safely({ load: () => loadModels({ auth: auth.props, searchValue }) });
    },
  });
}

function recordDropdown({ displayName = 'Record', description }: { displayName?: string; description?: string } = {}) {
  return Property.Dropdown({
    auth: odooAuth,
    displayName,
    description: description ?? 'The record to use. Type to search by name.',
    required: true,
    refreshers: ['model'],
    refreshOnSearch: true,
    options: async ({ auth, model }, { searchValue }) => {
      if (!auth) return disabled('Please connect your Odoo account first');
      if (typeof model !== 'string' || !model) return disabled('Please select a model first');
      return safely({ load: () => nameSearch({ auth: auth.props, model, searchValue }) });
    },
  });
}

function fixedModelDropdown({
  model,
  displayName,
  description,
  required,
  domain,
}: {
  model: string;
  displayName: string;
  description: string;
  required: boolean;
  domain?: Domain;
}) {
  return Property.Dropdown({
    auth: odooAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return disabled('Please connect your Odoo account first');
      return safely({ load: () => nameSearch({ auth: auth.props, model, searchValue, domain }) });
    },
  });
}

const COMMON_MODELS: { model: string; name: string }[] = [
  { model: 'res.partner', name: 'Contact' },
  { model: 'crm.lead', name: 'Lead/Opportunity' },
  { model: 'sale.order', name: 'Sales Order' },
  { model: 'account.move', name: 'Journal Entry / Invoice' },
  { model: 'product.template', name: 'Product' },
  { model: 'product.product', name: 'Product Variant' },
  { model: 'project.project', name: 'Project' },
  { model: 'project.task', name: 'Task' },
  { model: 'res.users', name: 'User' },
  { model: 'purchase.order', name: 'Purchase Order' },
  { model: 'stock.picking', name: 'Transfer' },
  { model: 'hr.employee', name: 'Employee' },
  { model: 'calendar.event', name: 'Calendar Event' },
  { model: 'helpdesk.ticket', name: 'Helpdesk Ticket' },
];

export const odooProps = {
  modelDropdown,
  recordDropdown,
  fixedModelDropdown,
  loadModels,
  COMMON_MODELS,
};
