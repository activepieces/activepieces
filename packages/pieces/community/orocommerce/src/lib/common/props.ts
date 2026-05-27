import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { oroAuth } from './auth';
import { oroApiCall, fetchCollection } from './client';
import { OroAuth, OroJsonApiItem } from './types';

// --- Shared sentinels ---------------------------------------------------------

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

// --- Dropdown builders --------------------------------------------------------

function sanitizeSearch(value: string): string {
  return value.trim().replaceAll('"', '');
}

function attrLabel(...attrs: string[]): LabelFn {
  return (item) =>
    String(
      attrs.reduce<unknown>(
        (v, attr) => v ?? item.attributes[attr],
        undefined
      ) ?? item.id
    );
}

function clientSideFilterAndSort({
  items,
  searchValue,
  labelAttr,
}: {
  items: OroJsonApiItem[];
  searchValue: string | undefined;
  labelAttr: string;
}) {
  const lower = searchValue?.toLowerCase() ?? '';
  return items
    .map((item) => ({
      label: String(item.attributes[labelAttr] ?? item.id),
      value: item.id,
    }))
    .filter(({ label }) => !lower || label.toLowerCase().includes(lower))
    .sort((a, b) => a.label.localeCompare(b.label));
}

function makeSearchableDropdown({
  displayName,
  description,
  required = false,
  refreshers = [],
  resourceUri,
  fieldsParam,
  searchExpr,
  labelFn,
  extraParams = {},
}: SearchableDropdownConfig) {
  return Property.Dropdown({
    auth: oroAuth,
    displayName,
    description,
    required,
    refreshers,
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return NOT_CONNECTED;
      try {
        const params: Record<string, string> = {
          [`fields[${resourceUri.slice(1)}]`]: fieldsParam,
          ...extraParams,
        };
        const trimmed = searchValue?.trim() ?? '';
        if (trimmed.length > 0) {
          params['filter[searchQuery]'] = searchExpr(sanitizeSearch(trimmed));
        }
        const items = await fetchCollection({
          auth: auth as OroAuth,
          resourceUri,
          queryParams: params,
        });
        return {
          options: items.map((item) => ({
            label: labelFn(item),
            value: item.id,
          })),
        };
      } catch {
        return FAILED;
      }
    },
  });
}

function makeEnumDropdown({
  displayName,
  description,
  required = false,
  resourceUri,
  labelFn,
  extraParams = {},
}: EnumDropdownConfig) {
  return Property.Dropdown({
    auth: oroAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) return NOT_CONNECTED;
      try {
        const items = await fetchCollection({
          auth: auth as OroAuth,
          resourceUri,
          queryParams: extraParams,
        });
        return {
          options: items.map((item) => ({
            label: labelFn(item),
            value: item.id,
          })),
        };
      } catch {
        return FAILED;
      }
    },
  });
}

// --- Customers ----------------------------------------------------------------

export const customerDropdown = makeSearchableDropdown({
  displayName: 'Customer',
  description: 'Select a customer.',
  required: false,
  resourceUri: '/customers',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

export const customerRequiredDropdown = makeSearchableDropdown({
  displayName: 'Customer',
  description: 'The customer this order belongs to.',
  required: true,
  resourceUri: '/customers',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

// --- Customer Users -----------------------------------------------------------
// Pre-filters by customer relationship when customer is selected.
// Kept custom due to multi-refresher logic and composite label.

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
        const resolvedCustomer = (customerId as string) || (customer as string);
        if (!resolvedCustomer || resolvedCustomer.length === 0) {
          return {
            disabled: true,
            placeholder: 'Select Customer first.',
            options: [],
          };
        }
        const searchFilters = [`customer_id = ${resolvedCustomer}`];
        const trimmed = searchValue?.trim() ?? '';
        if (trimmed.length > 0) {
          searchFilters.push(`allText ~ "${sanitizeSearch(trimmed)}"`);
        }
        const items = await fetchCollection({
          auth: auth as OroAuth,
          resourceUri: '/customerusers',
          queryParams: {
            'fields[customerusers]': 'id,firstName,lastName,email',
            'filter[searchQuery]': searchFilters.join(' and '),
          },
        });
        return {
          options: items.map((item) => {
            const firstName = String(item.attributes['firstName'] ?? '');
            const lastName = String(item.attributes['lastName'] ?? '');
            const email = String(item.attributes['email'] ?? '');
            const namePart = [firstName, lastName].filter(Boolean).join(' ');
            const label = [namePart, email].filter(Boolean).join(' - ') || item.id;
            return { label, value: item.id };
          }),
        };
      } catch {
        return FAILED;
      }
    },
  });

// --- Organizations ------------------------------------------------------------

export const organizationDropdown = makeSearchableDropdown({
  displayName: 'Organization',
  description: 'The organization this record belongs to.',
  resourceUri: '/organizations',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

// --- Users (admin) ------------------------------------------------------------

export const userDropdown = makeSearchableDropdown({
  displayName: 'Owner',
  description:
    'The back-office user who owns this record. Search by name, username or email.',
  resourceUri: '/users',
  fieldsParam: 'id,firstName,lastName,username',
  searchExpr: (q) => `allText ~ "${q}"`,
  labelFn: (item) => {
    const firstName = String(item.attributes['firstName'] ?? '');
    const lastName = String(item.attributes['lastName'] ?? '');
    const username = String(item.attributes['username'] ?? '');
    const fullName = [firstName, lastName].filter(Boolean).join(' ');
    return username
      ? fullName
        ? `${username}: ${fullName}`
        : username
      : fullName || item.id;
  },
});

// --- Websites -----------------------------------------------------------------

export const websiteDropdown = makeSearchableDropdown({
  displayName: 'Website',
  description: 'The website this record is associated with.',
  resourceUri: '/websites',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

// --- Invoice Internal Statuses ------------------------------------------------

export const invoiceInternalStatusDropdown = makeEnumDropdown({
  displayName: 'Internal Status',
  description: 'Invoice internal status (e.g. Draft, Open).',
  resourceUri: '/invoiceinternalstatuses',
  labelFn: attrLabel('name'),
});

// --- Order Internal Statuses --------------------------------------------------

export const orderInternalStatusDropdown = makeEnumDropdown({
  displayName: 'Internal Status',
  description: 'Order internal status (e.g. Open, Cancelled).',
  resourceUri: '/orderinternalstatuses',
  labelFn: attrLabel('name'),
});

// --- Products -----------------------------------------------------------------
// Kept custom: requires JSON:API `include` + relationship traversal to resolve
// the default-locale product name from the included `productnames` sideloads.

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
        include: 'names',
        'fields[productnames]': 'id,string,localization',
      };
      const trimmed = searchValue?.trim() ?? '';
      if (trimmed.length > 0) {
        params['filter[searchQuery]'] = `allText ~ "${sanitizeSearch(
          trimmed
        )}" and productStatus = "enabled"`;
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
        included?: {
          type: string;
          id: string;
          attributes: Record<string, unknown>;
          relationships: Record<string, unknown>;
        }[];
      };

      const nameMap = buildProductNameMap(body.included ?? []);

      return {
        options: (body.data ?? []).map((item) => {
          const sku = String(item.attributes['sku'] ?? '');
          const name = nameMap[item.id] ?? '';
          return {
            label: name ? `${item.id}: ${sku} - ${name}` : `${item.id}: ${sku}`,
            value: item.id,
          };
        }),
      };
    } catch {
      return FAILED;
    }
  },
});

// --- Payment Terms ------------------------------------------------------------

export const paymentTermDropdown = makeSearchableDropdown({
  displayName: 'Payment Term',
  description: 'Search payment terms.',
  resourceUri: '/paymentterms',
  fieldsParam: 'id,label',
  searchExpr: (q) => `label ~ "${q}"`,
  labelFn: attrLabel('label'),
});

// --- Warehouses ---------------------------------------------------------------

export const warehouseDropdown = makeSearchableDropdown({
  displayName: 'Warehouse',
  description: 'Search warehouses.',
  resourceUri: '/warehouses',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

// --- Countries ----------------------------------------------------------------
// Loads the full list (~250 ISO countries) once and filters client-side.

export const buildCountryDropdown = (
  { required = false, displayName = 'Country' }: { required?: boolean; displayName?: string } = {}
) =>
  Property.Dropdown({
    auth: oroAuth,
    displayName,
    description: 'ISO-3166 country. Start typing to filter the list.',
    required,
    refreshers: [],
    options: async ({ auth }, { searchValue }) => {
      if (!auth) return NOT_CONNECTED;
      try {
        const items = await fetchCollection({
          auth: auth as OroAuth,
          resourceUri: '/countries',
          queryParams: { 'fields[countries]': 'id,name', 'page[size]': '300' },
        });
        return {
          options: clientSideFilterAndSort({
            items,
            searchValue,
            labelAttr: 'name',
          }),
        };
      } catch {
        return FAILED;
      }
    },
  });

// --- Regions ------------------------------------------------------------------
// Loads all regions for the selected country once and filters client-side.

export const buildRegionDropdown = ({
  countryRefresher,
  required = false,
  displayName = 'Region / State',
}: {
  countryRefresher: string;
  required?: boolean;
  displayName?: string;
}) =>
  Property.Dropdown({
    auth: oroAuth,
    displayName,
    description:
      'Region or state. Select a country first. Start typing to filter.',
    required,
    refreshers: [countryRefresher],
    options: async (context) => {
      const auth = context['auth'] as OroAuth | undefined;
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
        const items = await fetchCollection({
          auth,
          resourceUri: '/regions',
          queryParams: { 'filter[country]': countryId },
        });
        return {
          options: clientSideFilterAndSort({
            items,
            searchValue: undefined,
            labelAttr: 'name',
          }),
        };
      } catch {
        return FAILED;
      }
    },
  });

// --- Order Statuses (external) ------------------------------------------------

export const orderStatusDropdown = makeEnumDropdown({
  displayName: 'Status',
  description:
    'Order status managed by an external system (only relevant when "Enable External Status Management" is on).',
  resourceUri: '/orderstatuses',
  labelFn: attrLabel('name'),
});

// --- Orders -------------------------------------------------------------------

export const orderDropdown = makeSearchableDropdown({
  displayName: 'Parent Order',
  description: 'Search orders to use as the parent order.',
  resourceUri: '/orders',
  fieldsParam: 'id,identifier,poNumber',
  searchExpr: (q) => `allText ~ "${q}"`,
  labelFn: attrLabel('identifier', 'poNumber'),
});

// --- Product Units ------------------------------------------------------------

export const productUnitDropdown = makeEnumDropdown({
  displayName: 'Product Unit',
  description: 'Unit of measure for the product (e.g. each, set, kg).',
  resourceUri: '/productunits',
  labelFn: attrLabel('label', 'code'),
  extraParams: { 'page[size]': '100' },
});

// --- Customer Groups ----------------------------------------------------------

export const customerGroupDropdown = makeSearchableDropdown({
  displayName: 'Customer Group',
  description: 'Search customer groups.',
  resourceUri: '/customergroups',
  fieldsParam: 'id,name',
  searchExpr: (q) => `name ~ "${q}"`,
  labelFn: attrLabel('name'),
});

// --- Customer Tax Codes -------------------------------------------------------

export const customerTaxCodeDropdown = makeSearchableDropdown({
  displayName: 'Tax Code',
  description: 'Search customer tax codes.',
  resourceUri: '/customertaxcodes',
  fieldsParam: 'id,code',
  searchExpr: (q) => `code ~ "${q}"`,
  labelFn: attrLabel('code'),
});

// --- Customer Ratings ---------------------------------------------------------

export const customerRatingDropdown = makeEnumDropdown({
  displayName: 'Internal Rating',
  description: 'Internal customer rating (e.g. "1 of 5", "5 of 5").',
  resourceUri: '/customerratings',
  labelFn: attrLabel('name'),
  extraParams: { 'fields[customerratings]': 'id,name' },
});

// --- Customer User Roles ------------------------------------------------------

export const customerUserRoleDropdown = makeSearchableDropdown({
  displayName: 'Roles',
  description: 'Customer user roles. Search by label.',
  resourceUri: '/customeruserroles',
  fieldsParam: 'id,label,role',
  searchExpr: (q) => `label ~ "${q}"`,
  labelFn: attrLabel('label', 'role'),
});

// --- Additional Attributes / Relations (custom entity fields) -----------------

export const additionalAttributesProp = Property.Json({
  displayName: 'Additional Attributes',
  description:
    'Optional JSON object with custom entity attributes. ' +
    'Keys are attribute names, values are their values. ' +
    'Example: {"myCustomField": "value", "priority": 5}. ' +
    'These are merged into the request body after the standard fields.',
  required: false,
  defaultValue: {},
});

export const additionalRelationsProp = Property.Json({
  displayName: 'Additional Relations',
  description:
    'Optional JSON object with custom entity relationships. ' +
    'Each key is a relationship name and the value must follow JSON:API linkage format. ' +
    'Example: {"myRelation": {"data": {"type": "myentities", "id": "1"}}, ' +
    '"myMultiRelation": {"data": [{"type": "otherentities", "id": "2"}]}}. ' +
    'These are merged into the request body after the standard relationships.',
  required: false,
  defaultValue: {},
});

// --- Private helpers ----------------------------------------------------------

function buildProductNameMap(
  included: {
    type: string;
    id: string;
    attributes: Record<string, unknown>;
    relationships: Record<string, unknown>;
  }[]
): Record<string, string> {
  return included.reduce<Record<string, string>>((map, inc) => {
    if (inc.type !== 'productnames') return map;
    const localizationRel = inc.relationships['localization'] as
      | { data: { type: string; id: string } | null }
      | undefined;
    if (localizationRel?.data !== null) return map;
    const productRel = inc.relationships['product'] as
      | { data: { type: string; id: string } | null }
      | undefined;
    const productId = productRel?.data?.id;
    if (!productId) return map;
    return { ...map, [productId]: String(inc.attributes['string'] ?? '') };
  }, {});
}

// --- Types --------------------------------------------------------------------

type LabelFn = (item: OroJsonApiItem) => string;

type SearchableDropdownConfig = {
  displayName: string;
  description: string;
  required?: boolean;
  refreshers?: string[];
  resourceUri: string;
  fieldsParam: string;
  searchExpr: (sanitizedQuery: string) => string;
  labelFn: LabelFn;
  extraParams?: Record<string, string>;
};

type EnumDropdownConfig = {
  displayName: string;
  description: string;
  required?: boolean;
  resourceUri: string;
  labelFn: LabelFn;
  extraParams?: Record<string, string>;
};
