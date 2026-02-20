import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oroAuth } from './auth';
import { oroApiCall } from './client';
import { OroAuth } from './types';

// --- Internal types -----------------------------------------------------------

interface OroJsonApiItem {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

interface OroJsonApiCollection {
  data: OroJsonApiItem[];
}

// --- Helpers ------------------------------------------------------------------

const NOT_CONNECTED = {
  disabled: true,
  placeholder: 'Connect your OroCommerce account first',
  options: [],
};

const FAILED = {
  disabled: true,
  placeholder: 'Failed to load options. Check your connection.',
  options: [],
};

async function fetchCollection(
  auth: OroAuth,
  resourceUri: string,
  queryParams?: Record<string, string>
): Promise<OroJsonApiItem[]> {
  const response = await oroApiCall({
    method: HttpMethod.GET,
    resourceUri,
    auth,
    queryParams: { 'page[size]': '50', ...queryParams },
  });

  return (response.body as OroJsonApiCollection).data ?? [];
}

// --- Customers ----------------------------------------------------------------
// Supports filter[searchText] — search across name and other indexed fields.

function buildCustomerOptions(
  required: boolean,
  displayName = 'Customer',
  description = 'Select a customer.'
) {
  return Property.Dropdown({
    auth: oroAuth,
    displayName,
    description,
    required,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return NOT_CONNECTED;
      try {
        const params: Record<string, string> = {
          'fields[customers]': 'id,name',
        };
        if (searchValue && searchValue.trim().length > 0) {
          params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
        }

        const items = await fetchCollection(
          auth as OroAuth,
          '/customers',
          params
        );
        return {
          options: items.map((item) => ({
            label: String(item.attributes['name'] ?? item.id),
            value: item.id,
          })),
        };
      } catch {
        return FAILED;
      }
    },
  });
}

export const customerDropdown = buildCustomerOptions(false);
export const customerRequiredDropdown = buildCustomerOptions(
  true,
  'Customer',
  'The customer this order belongs to.'
);

// --- Customer Users -----------------------------------------------------------
// Supports filter[searchText] — searches email, firstName, lastName, etc.
// Also pre-filters by customer relationship when customer is selected.

export const customerUserDropdown = (required = false) =>
  Property.Dropdown({
    auth: oroAuth,
    displayName: 'Customer User',
    description: 'Select a Customer User.',
    required,
    refreshers: ['customer', 'customerId'],
    refreshOnSearch: true,
    options: async ({ auth, customer, customerId }, { searchValue }) => {
      if (!auth) return NOT_CONNECTED;

      try {
        const params: Record<string, string> = {
          'fields[customerusers]': 'id,firstName,lastName,email',
        };

        const resolvedCustomer = (customerId as string) || (customer as string);
        if (!resolvedCustomer || resolvedCustomer.length == 0) {
          return {
            disabled: true,
            placeholder: 'Select Customer first.',
            options: [],
          };
        }
        const searchFilters = [`customer_id = ${resolvedCustomer}`];
        if (searchValue && searchValue.trim().length > 0) {
          searchFilters.push(`allText ~ "${searchValue.trim().replace('"', '')}"`);
        }

        params['filter[searchQuery]'] = searchFilters.join(' and ');
        const items = await fetchCollection(
          auth as OroAuth,
          '/customerusers',
          params
        );
        return {
          options: items.map((item) => {
            const firstName = String(item.attributes['firstName'] ?? '');
            const lastName = String(item.attributes['lastName'] ?? '');
            const email = String(item.attributes['email'] ?? '');
            const label =
              [firstName, lastName].filter(Boolean).join(' ') + ' - ' + email ||
              item.id;
            return { label, value: item.id };
          }),
        };
      } catch {
        return FAILED;
      }
    },
  });

// --- Organizations ------------------------------------------------------------
// Supports filter[searchText].

export const organizationDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Organization',
  description: 'Search organizations.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[organizations]': 'id,name'
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
      }

      const items = await fetchCollection(
        auth as OroAuth,
        '/organizations',
        params
      );
      return {
        options: items.map((item) => ({
          label: String(item.attributes['name'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Owner (admin users) ------------------------------------------------------
// Supports filter[searchText] — searches username, email, firstName, lastName.

export const ownerDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Owner',
  description:
    'Search user by name, username or email.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[users]': 'id,firstName,lastName,username'
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `allText ~ "${searchValue.trim().replace('"', '')}"`;
      }
      const items = await fetchCollection(auth as OroAuth, '/users', params);
      return {
        options: items.map((item) => {
          const firstName = String(item.attributes['firstName'] ?? '');
          const lastName = String(item.attributes['lastName'] ?? '');
          const username = String(item.attributes['username'] ?? '');
          const label =
            [firstName, lastName].filter(Boolean).join(' ') ||
            username ||
            item.id;
          return { label, value: item.id };
        }),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Websites -----------------------------------------------------------------
// Supports filter[searchText]. Small set in practice — still search-gated.

export const websiteDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Website',
  description: 'Search websites.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[websites]': 'id,name'
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
      }
      const items = await fetchCollection(auth as OroAuth, '/websites', params);
      return {
        options: items.map((item) => ({
          label: String(item.attributes['name'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Internal Statuses (Invoice) ----------------------------------------------
// Small enum — loaded once, no search needed.

export const invoiceInternalStatusDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Internal Status',
  description: 'Invoice internal status (e.g. Draft, Open).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const items = await fetchCollection(
        auth as OroAuth,
        '/invoiceinternalstatuses'
      );
      return {
        options: items.map((item) => ({
          label: String(item.attributes['name'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Order Internal Statuses --------------------------------------------------
// Small enum — loaded once, no search needed.

export const orderInternalStatusDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Internal Status',
  description: 'Order internal status (e.g. Open, Cancelled).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const items = await fetchCollection(
        auth as OroAuth,
        '/orderinternalstatuses'
      );
      return {
        options: items.map((item) => ({
          label: String(item.attributes['name'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Products ---──────────────────────────────────────────────────────────────
// Supports filter[searchText] — searches SKU, names, descriptions, etc.

export const productDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Product',
  description: 'Search products.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[products]': 'sku,status,names',
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `allText ~ "${searchValue.trim().replace('"', '')}" and productStatus = "enabled"`;
      } else {
        params['filter[status]'] = 'enabled';
      }

      const items = await fetchCollection(auth as OroAuth, '/products', params);
      return {
        options: items.map((item) => ({
          label: String(item.attributes['sku'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// ─── Payment Terms ────────────────────────────────────────────────────────────
// Supports filter[searchText].

export const paymentTermDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Payment Term',
  description: 'Search payment terms.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[paymentterms]': 'id,label'
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `label ~ "${searchValue.trim().replace('"', '')}"`;
      }

      const items = await fetchCollection(
        auth as OroAuth,
        '/paymentterms',
        params
      );
      return {
        options: items.map((item) => ({
          label: String(item.attributes['label'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// ─── Warehouses ───────────────────────────────────────────────────────────────
// Supports filter[searchText].

export const warehouseDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Warehouse',
  description: 'Search warehouses.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[warehouses]': 'id,name'
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
      }
      const items = await fetchCollection(
        auth as OroAuth,
        '/warehouses',
        params
      );
      return {
        options: items.map((item) => ({
          label: String(item.attributes['name'] ?? item.id),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// ─── Countries ────────────────────────────────────────────────────────────────
// Static dictionary — load full list once per connection (cached by auth refresher).
// Uses filter[name] for client-side filtering via the UI's built-in search box.
// Page size 300 to capture all ~250 ISO countries in one request.

export const buildCountryDropdown = (required = false, displayName = 'Country') =>
  Property.Dropdown({
    auth: oroAuth,
    displayName,
    description: 'ISO-3166 country. Start typing to filter the list.',
    required,
    refreshers: [],
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return NOT_CONNECTED;
      try {
        const params: Record<string, string> = {
          'fields[countries]': 'id,name'
        };
        // if (searchValue && searchValue.trim().length > 0) {
        //   params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
        // }

        const items = await fetchCollection(
          auth as OroAuth,
          '/countries',
          params
        );
        return {
          options: items
            .map((item) => ({
              label: String(item.attributes['name'] ?? item.id),
              value: item.id, // ISO2 code e.g. "US"
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        };
      } catch {
        return FAILED;
      }
    },
  });

// ─── Regions ──────────────────────────────────────────────────────────────────
// Static dictionary per country — load all regions for the selected country once.
// Cached by auth + countryRefresher. Uses filter[country] to scope results.

export const buildRegionDropdown = (
  countryRefresher: string,
  required = false,
  displayName = 'Region / State'
) =>
  Property.Dropdown({
    auth: oroAuth,
    displayName,
    description:
      'Region or state. Select a country first. Start typing to filter.',
    required,
    refreshers: [countryRefresher],
    options: async (context) => {
      const auth = context['auth'] as OroAuth | undefined;
      const searchValue = context['searchValue'] as string | undefined;
      const countryId = context[countryRefresher as keyof typeof context] as
        | string
        | undefined;
      if (!auth) return NOT_CONNECTED;
      if (!countryId)
        return {
          disabled: true,
          placeholder: 'Select a country first',
          options: [],
        };
      try {
        const params: Record<string, string> = {'filter[country]': countryId};
        // if (searchValue && searchValue.trim().length > 0) {
        //   params['filter[searchQuery]'] = `name ~ "${searchValue.trim().replace('"', '')}"`;
        //   params['filter[name]'] = searchValue.trim();
        // }

        const items = await fetchCollection(auth, '/regions', params);
        return {
          options: items
            .map((item) => ({
              label: String(item.attributes['name'] ?? item.id),
              value: item.id, // ISO 3166-2 code e.g. "US-NY"
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        };
      } catch {
        return FAILED;
      }
    },
  });

// ─── Product Units ────────────────────────────────────────────────────────────
// Small static list (each, set, kg, …) — load all once per connection.

export const productUnitDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Product Unit',
  description: 'Unit of measure for the product (e.g. each, set, kg).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const items = await fetchCollection(auth as OroAuth, '/productunits', {
        'page[size]': '100',
      });
      return {
        options: items.map((item) => ({
          // productunits use the string code as id (e.g. "each"), attributes may have label
          label: String(
            item.attributes['label'] ?? item.attributes['code'] ?? item.id
          ),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});
