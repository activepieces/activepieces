import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oroAuth } from './auth';
import { oroApiCall, fetchCollection } from './client';
import { OroAuth, OroJsonApiItem } from './types';

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
// Pre-filters by customer relationship when customer is selected.

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

// --- Invoice Internal Statuses ----------------------------------------------
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

// --- Products -----------------------------------------------------------------

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
        'fields[products]': 'id,sku,status,names',
        'include': 'names',
        'fields[productnames]': 'id,string,localization',
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `allText ~ "${searchValue.trim().replace('"', '')}" and productStatus = "enabled"`;
      } else {
        params['filter[status]'] = 'enabled';
      }

      const response = await oroApiCall({
        method: HttpMethod.GET,
        resourceUri: '/products',
        auth: auth as OroAuth,
        queryParams: { 'page[size]': '50', ...params },
      });

      const body = response.body as {
        data: OroJsonApiItem[];
        included?: { type: string; id: string; attributes: Record<string, unknown>; relationships: Record<string, unknown> }[];
      };

      // Build a map: productId → default name (localization.data === null)
      const nameMap: Record<string, string> = {};
      for (const inc of body.included ?? []) {
        if (inc.type === 'productnames') {
          const localizationRel = inc.relationships['localization'] as { data: { type: string; id: string } | null } | undefined;
          if (localizationRel?.data === null) {
            const productRel = inc.relationships['product'] as { data: { type: string; id: string } | null } | undefined;
            const productId = productRel?.data?.id;
            if (productId) {
              nameMap[productId] = String(inc.attributes['string'] ?? '');
            }
          }
        }
      }

      return {
        options: (body.data ?? []).map((item) => {
          const sku = String(item.attributes['sku'] ?? '');
          const name = nameMap[item.id] ?? '';
          const label = name
            ? `${item.id}: ${sku} - ${name}`
            : `${item.id}: ${sku}`;
          return { label, value: item.id };
        }),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Payment Terms ------------------------------------------------------------

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

// --- Warehouses ---------------------------------------------------------------
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

// --- Countries ----------------------------------------------------------------
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

        const items = await fetchCollection(
          auth as OroAuth,
          '/countries',
          params
        );
        return {
          options: items
            .filter(function (item) {
              if (!searchValue || searchValue?.length == 0) {
                return true;
              }

              const searchBase = String(item.attributes['name'] ?? item.id);

              return searchBase.toLowerCase().includes(searchValue.toLowerCase());
            })
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

// --- Regions ------------------------------------------------------------------
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

        const items = await fetchCollection(auth, '/regions', params);
        return {
          options: items
            .filter(function (item) {
              if (!searchValue || searchValue?.length == 0) {
                return true;
              }

              const searchBase = String(item.attributes['name'] ?? item.id);

              return searchBase.toLowerCase().includes(searchValue.toLowerCase());
            })
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

// --- Order Statuses (external) ------------------------------------------------
// Small enum managed by an external system. Loaded once, no search needed.

export const orderStatusDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Status',
  description: 'Order status managed by an external system (only relevant when "Enable External Status Management" is on).',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const items = await fetchCollection(auth as OroAuth, '/orderstatuses');
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

// --- Parent Order -------------------------------------------------------------

export const orderDropdown = Property.Dropdown({
  auth: oroAuth,
  displayName: 'Parent Order',
  description: 'Search orders to use as the parent order.',
  required: false,
  refreshers: [],
  refreshOnSearch: true,
  options: async ({ auth }, { searchValue }) => {
    if (!auth) return NOT_CONNECTED;
    try {
      const params: Record<string, string> = {
        'fields[orders]': 'id,identifier,poNumber',
      };
      if (searchValue && searchValue.trim().length > 0) {
        params['filter[searchQuery]'] = `allText ~ "${searchValue.trim().replace('"', '')}"`;
      }
      const items = await fetchCollection(auth as OroAuth, '/orders', params);
      return {
        options: items.map((item) => ({
          label: String(
            item.attributes['identifier'] ??
            item.attributes['poNumber'] ??
            item.id
          ),
          value: item.id,
        })),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Product Units ------------------------------------------------------------
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
