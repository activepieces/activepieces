import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  customerRequiredDropdown,
  customerUserDropdown,
  organizationDropdown,
  ownerDropdown,
  websiteDropdown,
  orderInternalStatusDropdown,
  paymentTermDropdown,
  warehouseDropdown,
  buildCountryDropdown,
  buildRegionDropdown,
  productDropdown,
} from '../common';
import { OroAuth } from '../common/types';

export const createOrderAction = createAction({
  auth: oroAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Creates a new order record in OroCommerce.',
  props: {
    // -- Required relationships ------------------------------------------------
    customer: customerRequiredDropdown,
    customerId: Property.ShortText({
      displayName: 'Customer: Raw ID',
      description: 'Overrides the Customer dropdown. Paste an ID from a previous step.',
      required: false,
    }),

    // -- Optional attributes ---------------------------------------------------
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO-4217 3-letter currency code (e.g. USD, EUR).',
      required: false,
      defaultValue: 'USD',
    }),
    identifier: Property.ShortText({
      displayName: 'Identifier',
      description: 'Unique order reference (e.g. FR1012401Z).',
      required: false,
    }),
    poNumber: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number provided by the buyer.',
      required: false,
    }),
    customerNotes: Property.LongText({
      displayName: 'Customer Notes',
      description: 'Notes from the customer (e.g. "Call before delivery").',
      required: false,
    }),
    shipUntil: Property.ShortText({
      displayName: 'Ship Until Date',
      description: 'Latest acceptable ship date in YYYY-MM-DD format.',
      required: false,
    }),
    overriddenShippingCostAmount: Property.Number({
      displayName: 'Overridden Shipping Cost',
      description: 'Custom shipping cost that overrides the calculated value.',
      required: false,
    }),
    estimatedShippingCostAmount: Property.Number({
      displayName: 'Estimated Shipping Cost',
      description: 'Shipping cost calculated from the selected shipping method.',
      required: false,
    }),

    // -- Optional relationships ------------------------------------------------
    customerUser: customerUserDropdown(false),
    customerUserId: Property.ShortText({
      displayName: 'Customer User: Raw ID',
      description: 'Overrides the Customer User dropdown.',
      required: false,
    }),
    organization: organizationDropdown,
    organizationId: Property.ShortText({
      displayName: 'Organization: Raw ID',
      description: 'Overrides the Organization dropdown.',
      required: false,
    }),
    owner: ownerDropdown,
    ownerId: Property.ShortText({
      displayName: 'Owner: Raw ID',
      description: 'Overrides the Owner dropdown.',
      required: false,
    }),
    website: websiteDropdown,
    websiteId: Property.ShortText({
      displayName: 'Website: Raw ID',
      description: 'Overrides the Website dropdown.',
      required: false,
    }),
    internalStatus: orderInternalStatusDropdown,
    internalStatusId: Property.ShortText({
      displayName: 'Internal Status: Raw ID',
      description: 'Overrides the Internal Status dropdown (e.g. order_internal_status.open).',
      required: false,
    }),
    paymentTerm: paymentTermDropdown,
    paymentTermId: Property.ShortText({
      displayName: 'Payment Term: Raw ID',
      description: 'Overrides the Payment Term dropdown.',
      required: false,
    }),
    warehouse: warehouseDropdown,
    warehouseId: Property.ShortText({
      displayName: 'Warehouse: Raw ID',
      description: 'Overrides the Warehouse dropdown.',
      required: false,
    }),

    // -- Billing Address -------------------------------------------------------
    billingAddressLabel: Property.ShortText({
      displayName: 'Billing: Label',
      description: 'Address label (e.g. "Main Office").',
      required: false,
    }),
    billingAddressFirstName: Property.ShortText({
      displayName: 'Billing: First Name',
      required: false,
    }),
    billingAddressLastName: Property.ShortText({
      displayName: 'Billing: Last Name',
      required: false,
    }),
    billingAddressOrganization: Property.ShortText({
      displayName: 'Billing: Organization',
      required: false,
    }),
    billingAddressPhone: Property.ShortText({
      displayName: 'Billing: Phone',
      required: false,
    }),
    billingAddressStreet: Property.ShortText({
      displayName: 'Billing: Street',
      required: false,
    }),
    billingAddressStreet2: Property.ShortText({
      displayName: 'Billing: Street 2',
      required: false,
    }),
    billingAddressCity: Property.ShortText({
      displayName: 'Billing: City',
      required: false,
    }),
    billingAddressPostalCode: Property.ShortText({
      displayName: 'Billing: Postal Code',
      required: false,
    }),
    billingAddressCountry: buildCountryDropdown(false, 'Billing: Country'),
    billingAddressCountryId: Property.ShortText({
      displayName: 'Billing: Country Raw ID',
      description: 'Overrides the Billing Country dropdown (ISO-3166 2-letter code, e.g. US).',
      required: false,
    }),
    billingAddressRegion: buildRegionDropdown(
      'billingAddressCountry',
      false,
      'Billing: Region / State'
    ),
    billingAddressRegionId: Property.ShortText({
      displayName: 'Billing: Region Raw ID',
      description: 'Overrides the Billing Region dropdown (ISO 3166-2 code, e.g. US-NY).',
      required: false,
    }),
    billingAddressCustomRegion: Property.ShortText({
      displayName: 'Billing: Custom Region',
      description: 'Free-text region for countries without predefined regions.',
      required: false,
    }),

    // -- Shipping Address ------------------------------------------------------
    shippingAddressLabel: Property.ShortText({
      displayName: 'Shipping: Label',
      description: 'Address label (e.g. "Warehouse East").',
      required: false,
    }),
    shippingAddressFirstName: Property.ShortText({
      displayName: 'Shipping: First Name',
      required: false,
    }),
    shippingAddressLastName: Property.ShortText({
      displayName: 'Shipping: Last Name',
      required: false,
    }),
    shippingAddressOrganization: Property.ShortText({
      displayName: 'Shipping: Organization',
      required: false,
    }),
    shippingAddressPhone: Property.ShortText({
      displayName: 'Shipping: Phone',
      required: false,
    }),
    shippingAddressStreet: Property.ShortText({
      displayName: 'Shipping: Street',
      required: false,
    }),
    shippingAddressStreet2: Property.ShortText({
      displayName: 'Shipping: Street 2',
      required: false,
    }),
    shippingAddressCity: Property.ShortText({
      displayName: 'Shipping: City',
      required: false,
    }),
    shippingAddressPostalCode: Property.ShortText({
      displayName: 'Shipping: Postal Code',
      required: false,
    }),
    shippingAddressCountry: buildCountryDropdown(false, 'Shipping: Country'),
    shippingAddressCountryId: Property.ShortText({
      displayName: 'Shipping: Country Raw ID',
      description: 'Overrides the Shipping Country dropdown (ISO-3166 2-letter code, e.g. US).',
      required: false,
    }),
    shippingAddressRegion: buildRegionDropdown(
      'shippingAddressCountry',
      false,
      'Shipping: Region / State'
    ),
    shippingAddressRegionId: Property.ShortText({
      displayName: 'Shipping: Region Raw ID',
      description: 'Overrides the Shipping Region dropdown (ISO 3166-2 code, e.g. US-NY).',
      required: false,
    }),
    shippingAddressCustomRegion: Property.ShortText({
      displayName: 'Shipping: Custom Region',
      description: 'Free-text region for countries without predefined regions.',
      required: false,
    }),

    // -- Line Items ------------------------------------------------------------
    // DynamicProperties lets us load product units once as StaticDropdown.
    // Products are entered as SKU/ID text (framework does not support Dropdown inside Array).
    lineItems: Property.DynamicProperties({
      auth: oroAuth,
      displayName: 'Line Items',
      description: 'Order line items.',
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        type JsonApiCollection = { data: { id: string; attributes: Record<string, unknown> }[] };
        const unitOptions: { label: string; value: string }[] = [];

        if (auth) {
          try {
            const unitsResp = await oroApiCall({
              method: HttpMethod.GET,
              resourceUri: '/productunits',
              auth: auth as OroAuth,
              queryParams: { 'page[size]': '100' },
            });
            for (const item of (unitsResp.body as JsonApiCollection).data ?? []) {
              unitOptions.push({
                label: String(item.attributes['label'] || item.id),
                value: item.id,
              });
            }
          } catch { /* leave empty */ }
        }

        return {
          lineItems: Property.Array({
            displayName: 'Line Items',
            required: true,
            properties: {
              productSku: Property.ShortText({
                displayName: 'Product SKU or ID',
                description: 'Enter the product SKU or numeric ID. Use the top-level "Product (Search)" field to look up products.',
                required: true,
              }),
              productUnit: Property.StaticDropdown({
                displayName: 'Product Unit',
                description: 'Unit of measurement (e.g. piece, kg, set).',
                required: true,
                options: { disabled: false, options: unitOptions },
              }),
              productUnitId: Property.ShortText({
                displayName: 'Product Unit: Raw ID',
                description: 'Overrides the Product Unit dropdown (e.g. "piece", "kg").',
                required: false,
              }),
              quantity: Property.Number({
                displayName: 'Quantity',
                required: true,
              }),
              value: Property.Number({
                displayName: 'Unit Price',
                description: 'Price per unit used in this order.',
                required: true,
              }),
              currency: Property.ShortText({
                displayName: 'Currency',
                description: 'ISO-4217 code. Defaults to order currency if empty.',
                required: false,
              }),
              comment: Property.ShortText({
                displayName: 'Comment',
                required: false,
              }),
              shipBy: Property.ShortText({
                displayName: 'Ship By Date',
                description: 'YYYY-MM-DD. Latest acceptable ship date for this line.',
                required: false,
              }),
            },
          }),
        };
      },
    }),

    // -- Product Search helper (top-level, search-enabled) ---------------------
    // Use this to find a product SKU/ID, then paste it into line item "Product SKU or ID".
    productSearch: productDropdown,
  },

  async run(context) {
    const p = context.propsValue;

    // raw ID takes priority over dropdown selection when both are present
    const resolve = (rawId: string | null | undefined, dropdownVal: unknown): string | null => {
      const raw = rawId?.trim();
      if (raw) return raw;
      if (dropdownVal != null && String(dropdownVal).trim()) return String(dropdownVal).trim();
      return null;
    };

    const included: Record<string, unknown>[] = [];
    const relationships: Record<string, unknown> = {};

    // -- Helper: build an address included resource --------------------------
    function buildAddress(
      localId: string,
      fields: {
        label?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        organization?: string | null;
        phone?: string | null;
        street?: string | null;
        street2?: string | null;
        city?: string | null;
        postalCode?: string | null;
        country?: string | null;
        region?: string | null;
        customRegion?: string | null;
      }
    ): boolean {
      const hasData = Object.values(fields).some((v) => v != null && v !== '');
      if (!hasData) return false;

      const attrs: Record<string, unknown> = { fromExternalSource: false };
      const rels: Record<string, unknown> = {};

      const textFields: Array<keyof typeof fields> = [
        'label', 'firstName', 'lastName', 'organization',
        'phone', 'street', 'street2', 'city', 'postalCode', 'customRegion',
      ];
      for (const f of textFields) {
        if (fields[f]) attrs[f] = fields[f];
      }
      if (fields.country) {
        rels['country'] = { data: { type: 'countries', id: fields.country } };
      }
      if (fields.region) {
        rels['region'] = { data: { type: 'regions', id: fields.region } };
      }

      included.push({
        type: 'orderaddresses',
        id: localId,
        attributes: attrs,
        relationships: rels,
      });
      return true;
    }

    // -- Billing address -----------------------------------------------------
    const billingAdded = buildAddress('billing_address', {
      label:        p.billingAddressLabel,
      firstName:    p.billingAddressFirstName,
      lastName:     p.billingAddressLastName,
      organization: p.billingAddressOrganization,
      phone:        p.billingAddressPhone,
      street:       p.billingAddressStreet,
      street2:      p.billingAddressStreet2,
      city:         p.billingAddressCity,
      postalCode:   p.billingAddressPostalCode,
      country:      resolve(p.billingAddressCountryId, p.billingAddressCountry),
      region:       resolve(p.billingAddressRegionId,  p.billingAddressRegion),
      customRegion: p.billingAddressCustomRegion,
    });
    if (billingAdded) {
      relationships['billingAddress'] = {
        data: { type: 'orderaddresses', id: 'billing_address' },
      };
    }

    // -- Shipping address --------------──────────────────────────────────────
    const shippingAdded = buildAddress('shipping_address', {
      label:        p.shippingAddressLabel,
      firstName:    p.shippingAddressFirstName,
      lastName:     p.shippingAddressLastName,
      organization: p.shippingAddressOrganization,
      phone:        p.shippingAddressPhone,
      street:       p.shippingAddressStreet,
      street2:      p.shippingAddressStreet2,
      city:         p.shippingAddressCity,
      postalCode:   p.shippingAddressPostalCode,
      country:      resolve(p.shippingAddressCountryId, p.shippingAddressCountry),
      region:       resolve(p.shippingAddressRegionId,  p.shippingAddressRegion),
      customRegion: p.shippingAddressCustomRegion,
    });
    if (shippingAdded) {
      relationships['shippingAddress'] = {
        data: { type: 'orderaddresses', id: 'shipping_address' },
      };
    }

    // ── Line items ──────────────────────────────────────────────────────────
    // DynamicProperties wraps the array in an object keyed by "lineItems"
    const dynamicValue = (p.lineItems ?? {}) as Record<string, unknown>;
    const rawItems = (dynamicValue['lineItems'] ?? []) as Array<Record<string, unknown>>;

    const lineItemsRelData = rawItems.map((item, index) => {
      const lid = `li_${index + 1}`;

      // productSku holds either a numeric Oro ID or a SKU string
      const productSku    = (item['productSku'] as string | undefined)?.trim();
      const productUnitId = (item['productUnitId'] as string | undefined)?.trim()
                         || (item['productUnit']   as string | undefined)
                         || 'piece';

      const liAttributes: Record<string, unknown> = {
        quantity:           Number(item['quantity']),
        value:              Number(item['value']),
        currency:           item['currency'] || p.currency || 'USD',
        priceType:          10,
        fromExternalSource: false,
        checksum:           String(index),
      };
      if (item['comment']) liAttributes['comment'] = item['comment'];
      if (item['shipBy'])  liAttributes['shipBy']  = item['shipBy'];

      const liRelationships: Record<string, unknown> = {
        productUnit: { data: { type: 'productunits', id: String(productUnitId) } },
      };
      if (productSku) {
        liRelationships['product'] = { data: { type: 'products', id: productSku } };
      }

      included.push({
        type: 'orderlineitems',
        id: lid,
        attributes: liAttributes,
        relationships: liRelationships,
      });

      return { type: 'orderlineitems', id: lid };
    });
    relationships['lineItems'] = { data: lineItemsRelData };

    // ── Order attributes ────────────────────────────────────────────────────
    const attributes: Record<string, unknown> = { external: false };
    if (p.currency)                             attributes['currency']                     = p.currency;
    if (p.identifier)                           attributes['identifier']                   = p.identifier;
    if (p.poNumber)                             attributes['poNumber']                     = p.poNumber;
    if (p.customerNotes)                        attributes['customerNotes']                = p.customerNotes;
    if (p.shipUntil)                            attributes['shipUntil']                    = p.shipUntil;
    if (p.overriddenShippingCostAmount != null) attributes['overriddenShippingCostAmount'] = p.overriddenShippingCostAmount;
    if (p.estimatedShippingCostAmount  != null) attributes['estimatedShippingCostAmount']  = p.estimatedShippingCostAmount;

    // ── Order relationships — each resolved via raw ID → dropdown fallback ──
    const customerId = resolve(p.customerId, p.customer);
    if (customerId) {
      relationships['customer'] = { data: { type: 'customers', id: customerId } };
    }

    const customerUserId = resolve(p.customerUserId, p.customerUser);
    if (customerUserId) {
      relationships['customerUser'] = { data: { type: 'customerusers', id: customerUserId } };
    }

    const organizationId = resolve(p.organizationId, p.organization);
    if (organizationId) {
      relationships['organization'] = { data: { type: 'organizations', id: organizationId } };
    }

    const ownerId = resolve(p.ownerId, p.owner);
    if (ownerId) {
      relationships['owner'] = { data: { type: 'users', id: ownerId } };
    }

    const websiteId = resolve(p.websiteId, p.website);
    if (websiteId) {
      relationships['website'] = { data: { type: 'websites', id: websiteId } };
    }

    const internalStatusId = resolve(p.internalStatusId, p.internalStatus);
    if (internalStatusId) {
      relationships['internalStatus'] = { data: { type: 'orderinternalstatuses', id: internalStatusId } };
    }

    const paymentTermId = resolve(p.paymentTermId, p.paymentTerm);
    if (paymentTermId) {
      relationships['paymentTerm'] = { data: { type: 'paymentterms', id: paymentTermId } };
    }

    const warehouseId = resolve(p.warehouseId, p.warehouse);
    if (warehouseId) {
      relationships['warehouse'] = { data: { type: 'warehouses', id: warehouseId } };
    }

    // ── POST /orders ────────────────────────────────────────────────────────
    const response = await oroApiCall({
      method: HttpMethod.POST,
      resourceUri: '/orders',
      auth: context.auth,
      body: {
        data: { type: 'orders', attributes, relationships },
        included,
      },
    });

    return response.body;
  },
});
