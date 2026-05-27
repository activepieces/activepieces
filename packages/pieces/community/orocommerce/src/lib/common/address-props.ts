import { Property } from '@activepieces/pieces-framework';

export function buildIncludedAddress({
  lid,
  type,
  addr,
  extraAttributes = {},
}: {
  lid: string;
  type: string;
  addr: Record<string, unknown>;
  extraAttributes?: Record<string, unknown>;
}): Record<string, unknown> {
  const attrs: Record<string, unknown> = {};
  const rels: Record<string, unknown> = {};

  const textFields = [
    'label',
    'namePrefix',
    'firstName',
    'middleName',
    'lastName',
    'nameSuffix',
    'organization',
    'phone',
    'street',
    'street2',
    'city',
    'postalCode',
    'customRegion',
  ];
  for (const f of textFields) {
    if (addr[f]) attrs[f] = addr[f];
  }
  if (addr['primary'] != null) attrs['primary'] = addr['primary'];

  const types = buildAddressTypes({
    typesBilling: addr['typesBilling'] as boolean | undefined,
    typesShipping: addr['typesShipping'] as boolean | undefined,
    defaultBilling: addr['defaultBilling'] as boolean | undefined,
    defaultShipping: addr['defaultShipping'] as boolean | undefined,
  });
  if (types.length > 0) attrs['types'] = types;

  if (addr['country']) {
    rels['country'] = { data: { type: 'countries', id: addr['country'] } };
  }
  if (addr['region']) {
    rels['region'] = { data: { type: 'regions', id: addr['region'] } };
  }

  return { type, id: lid, attributes: { ...extraAttributes, ...attrs }, relationships: rels };
}

function buildAddressTypes({
  typesBilling,
  typesShipping,
  defaultBilling,
  defaultShipping,
}: {
  typesBilling?: boolean;
  typesShipping?: boolean;
  defaultBilling?: boolean;
  defaultShipping?: boolean;
}): Array<{ addressType: string; default: boolean }> {
  return [
    ...(typesBilling ? [{ addressType: 'billing', default: defaultBilling === true }] : []),
    ...(typesShipping ? [{ addressType: 'shipping', default: defaultShipping === true }] : []),
  ];
}

/**
 * Core address fields for use inside `Property.Array`.
 * Auth-bound dropdowns are not permitted in array item properties, so
 * country and region accept raw ISO codes as ShortText.
 * Spread into `Property.Array` `properties` and extend with entity-specific fields.
 */
export const baseAddressArrayItemProps = {
  label: Property.ShortText({
    displayName: 'Label',
    description: 'Human-readable identifier for this address (e.g. "Main Office").',
    required: false,
  }),
  namePrefix: Property.ShortText({
    displayName: 'Name Prefix',
    description: 'Honorific of the contact person (e.g. Mr., Dr.).',
    required: false,
  }),
  firstName: Property.ShortText({
    displayName: 'First Name',
    required: false,
  }),
  middleName: Property.ShortText({
    displayName: 'Middle Name',
    required: false,
  }),
  lastName: Property.ShortText({
    displayName: 'Last Name',
    required: false,
  }),
  nameSuffix: Property.ShortText({
    displayName: 'Name Suffix',
    description: 'Name suffix (e.g. Jr., M.D.).',
    required: false,
  }),
  organization: Property.ShortText({
    displayName: 'Organization',
    description: 'Organisation the contact person belongs to.',
    required: false,
  }),
  phone: Property.ShortText({
    displayName: 'Phone',
    required: false,
  }),
  street: Property.ShortText({
    displayName: 'Street',
    required: false,
  }),
  street2: Property.ShortText({
    displayName: 'Street 2',
    required: false,
  }),
  city: Property.ShortText({
    displayName: 'City',
    required: false,
  }),
  postalCode: Property.ShortText({
    displayName: 'Postal Code',
    required: false,
  }),
  country: Property.ShortText({
    displayName: 'Country',
    description: 'ISO-3166 two-letter country code (e.g. US, DE). Use the Custom API Call action to look up /countries.',
    required: false,
  }),
  region: Property.ShortText({
    displayName: 'Region / State',
    description: 'ISO 3166-2 region code (e.g. US-NY). Use the Custom API Call action to look up /regions.',
    required: false,
  }),
  customRegion: Property.ShortText({
    displayName: 'Custom Region',
    description: 'Free-text region for countries without predefined regions.',
    required: false,
  }),
};

/**
 * Billing / shipping type fields. Spread after `baseAddressArrayItemProps`
 * for entities that support OroCommerce's `types` attribute
 * (customeraddresses, customeruseraddresses).
 */
export const addressTypeProps = {
  typesBilling: Property.Checkbox({
    displayName: 'Billing Address',
    description: 'Mark this address as a billing address.',
    required: false,
  }),
  typesShipping: Property.Checkbox({
    displayName: 'Shipping Address',
    description: 'Mark this address as a shipping address.',
    required: false,
  }),
  defaultBilling: Property.Checkbox({
    displayName: 'Default for Billing',
    description: 'Use as the default billing address.',
    required: false,
  }),
  defaultShipping: Property.Checkbox({
    displayName: 'Default for Shipping',
    description: 'Use as the default shipping address.',
    required: false,
  }),
};


