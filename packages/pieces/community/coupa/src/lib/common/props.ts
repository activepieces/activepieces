import { HttpMethod } from '@activepieces/pieces-common';
import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { CoupaClient } from './client';
import { coupaAuth } from '../auth';
import { CoupaModule, isRecord } from './utils';

export const COUPA_MODULE_OPTIONS = [
  { label: 'Purchase Orders', value: 'purchase_orders' },
  { label: 'Suppliers', value: 'suppliers' },
  { label: 'Contracts', value: 'contracts' },
  { label: 'Custom resource (type below)', value: '__custom__' },
];

export const moduleProperty = Property.StaticDropdown({
  displayName: 'Module',
  description:
    'Coupa module to work with: Purchase Orders, Suppliers, or Contracts. Pick "Custom resource" to target any other endpoint.',
  required: true,
  options: {
    disabled: false,
    options: COUPA_MODULE_OPTIONS,
  },
});

export const customModuleResourceProperty = Property.ShortText({
  displayName: 'Custom Resource Path',
  description:
    'API resource segment when Module is **Custom resource**, e.g. `invoices` or `approvals`.',
  required: false,
});

export const objectIdProperty = Property.Number({
  displayName: 'Object ID',
  description: 'Numeric Coupa ID of the record.',
  required: true,
});

export const requestBodyProperty = Property.Json({
  displayName: 'Request Body (JSON)',
  description:
    'JSON payload sent to Coupa, using Coupa field names in kebab-case (e.g. `po-number`, `supplier-id`). See the examples above for each module.',
  required: true,
});

export const requestBodyHelp = Property.MarkDown({
  value: `**How to build the request body** — Coupa uses field names in **kebab-case**. Reference an existing record (like a supplier) by its numeric ID. Examples per module:

**Purchase Orders**
\`\`\`json
{ "po-number": "PO-1001", "supplier": { "id": 123 }, "order-lines": [{ "description": "Laptop", "quantity": 2, "price": 1500 }] }
\`\`\`

**Suppliers**
\`\`\`json
{ "name": "Acme Corp", "display-name": "Acme", "status": "active" }
\`\`\`

**Contracts**
\`\`\`json
{ "name": "Acme MSA 2025", "supplier": { "id": 123 }, "start-date": "2025-01-01", "end-date": "2025-12-31" }
\`\`\``,
});

export const optionalQueryParamsProperty = Property.Json({
  displayName: 'Query Parameters (JSON)',
  description:
    'Optional query filters, e.g. `{ "status[in]": "issued,closed", "exported": false }`.',
  required: false,
});

export const purchaseOrderDropdown = Property.Dropdown({
  displayName: 'Purchase Order',
  description: 'Select a purchase order from your Coupa instance (most recent 50).',
  required: true,
  refreshers: [],
  auth: coupaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Coupa account first',
      };
    }
    try {
      const client = new CoupaClient(auth.props);
      const orders = await client.request<Array<Record<string, unknown>>>({
        method: HttpMethod.GET,
        resourceUri: '/purchase_orders',
        query: {
          limit: 50,
          fields: '["id","po-number","number","status","total","supplier"]',
        },
      });
      const list = Array.isArray(orders) ? orders : [];
      if (list.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No purchase orders found in your instance.',
        };
      }
      return {
        disabled: false,
        options: list.map((order) => {
          const poNumber = order['po-number'] ?? order['number'] ?? order['id'];
          const status = order['status'] ?? 'unknown';
          return {
            label: `${poNumber} — ${status} (#${order['id']})`,
            value: String(order['id']),
          };
        }),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load purchase orders. Check your connection and scopes.',
      };
    }
  },
});

export const contractDropdown = Property.Dropdown({
  displayName: 'Contract',
  description: 'Select a contract from your Coupa instance (most recent 50).',
  required: true,
  refreshers: [],
  auth: coupaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Coupa account first',
      };
    }
    try {
      const client = new CoupaClient(auth.props);
      const contracts = await client.request<Array<Record<string, unknown>>>({
        method: HttpMethod.GET,
        resourceUri: '/contracts',
        query: {
          limit: 50,
          fields: '["id","name","number","status","supplier"]',
        },
      });
      const list = Array.isArray(contracts) ? contracts : [];
      if (list.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No contracts found in your instance.',
        };
      }
      return {
        disabled: false,
        options: list.map((contract) => ({
          label: `${contract['name'] ?? contract['number'] ?? 'Contract'} (#${contract['id']})`,
          value: String(contract['id']),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load contracts. Check your connection and scopes.',
      };
    }
  },
});

export const supplierDropdown = Property.Dropdown({
  displayName: 'Supplier',
  description: 'Select a supplier from your Coupa instance (most recent 50).',
  required: true,
  refreshers: [],
  auth: coupaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Coupa account first',
      };
    }
    try {
      const client = new CoupaClient(auth.props);
      const suppliers = await client.request<Array<Record<string, unknown>>>({
        method: HttpMethod.GET,
        resourceUri: '/suppliers',
        query: { limit: 50, fields: '["id","name","number","status"]' },
      });
      const list = Array.isArray(suppliers) ? suppliers : [];
      if (list.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No suppliers found in your instance.',
        };
      }
      return {
        disabled: false,
        options: list.map((supplier) => ({
          label: `${supplier['name'] ?? 'Supplier'} (#${supplier['id']})`,
          value: String(supplier['id']),
        })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load suppliers. Check your connection and scopes.',
      };
    }
  },
});

export const pendingApprovalDropdown = Property.Dropdown({
  displayName: 'Approval',
  description:
    'Select a pending approval awaiting a decision. Shows the most recent 50 pending approvals.',
  required: true,
  refreshers: [],
  auth: coupaAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your Coupa account first',
      };
    }
    try {
      const client = new CoupaClient(auth.props);
      const approvals = await client.request<Array<Record<string, unknown>>>({
        method: HttpMethod.GET,
        resourceUri: '/approvals',
        query: {
          'status[in]': 'pending_approval',
          limit: 50,
          fields: '["id","status","approvable-type","approvable-id","position"]',
        },
      });
      const list = Array.isArray(approvals) ? approvals : [];
      if (list.length === 0) {
        return {
          disabled: false,
          options: [],
          placeholder: 'No pending approvals found.',
        };
      }
      return {
        disabled: false,
        options: list.map((approval) => {
          const type = approval['approvable-type'] ?? 'Record';
          const refId = approval['approvable-id'] ?? approval['id'];
          return {
            label: `${type} #${refId} (approval #${approval['id']})`,
            value: String(approval['id']),
          };
        }),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load approvals. Check your connection and scopes.',
      };
    }
  },
});

export const objectSelector = Property.DynamicProperties({
  displayName: 'Record',
  description: 'Pick the record by name. For a custom resource, enter its numeric ID.',
  required: true,
  refreshers: ['module'],
  auth: coupaAuth,
  props: async ({ module }): Promise<DynamicPropsValue> => {
    if (module === 'purchase_orders') {
      return { objectId: purchaseOrderDropdown };
    }
    if (module === 'suppliers') {
      return { objectId: supplierDropdown };
    }
    if (module === 'contracts') {
      return { objectId: contractDropdown };
    }
    return { objectId: objectIdProperty };
  },
});

export const attachmentModuleProperty = Property.StaticDropdown({
  displayName: 'Module',
  description: 'The type of record to attach the file to.',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Purchase Order', value: 'purchase_orders' },
      { label: 'Supplier', value: 'suppliers' },
      { label: 'Contract', value: 'contracts' },
    ],
  },
});

export const remitToParentTypeProperty = Property.StaticDropdown({
  displayName: 'Parent Module',
  description:
    'Where to look up remit-to addresses from: a Supplier directly, or the supplier linked to a Purchase Order.',
  required: true,
  options: {
    disabled: false,
    options: [
      { label: 'Supplier', value: 'suppliers' },
      { label: 'Purchase Order', value: 'purchase_orders' },
    ],
  },
});

export function resolveModuleResource(
  module: string | undefined,
  customResource: string | undefined
): string {
  if (module === '__custom__') {
    if (!customResource?.trim()) {
      throw new Error('Custom Resource Path is required when using a custom module.');
    }
    return customResource.trim().replace(/^\/+/, '').replace(/\/+$/, '');
  }
  if (!module) {
    throw new Error('Module is required.');
  }
  return module;
}

export function toCoupaModule(module: string): CoupaModule {
  if (module === 'purchase_orders' || module === 'suppliers' || module === 'contracts') {
    return module;
  }
  throw new Error(
    'Standard fields are only mapped for Purchase Orders, Suppliers, and Contracts modules.'
  );
}

export function parseOptionalQuery(
  queryJson: unknown
): Record<string, string | number | boolean | undefined> {
  if (!queryJson) {
    return {};
  }
  let parsed: unknown = queryJson;
  if (typeof queryJson === 'string') {
    try {
      parsed = JSON.parse(queryJson);
    } catch {
      throw new Error('Query Parameters must be valid JSON.');
    }
  }
  if (!isRecord(parsed)) {
    return {};
  }
  const result: Record<string, string | number | boolean | undefined> = {};
  for (const [key, value] of Object.entries(parsed)) {
    if (value === undefined || value === null) {
      continue;
    }
    result[key] =
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? value
        : String(value);
  }
  return result;
}
