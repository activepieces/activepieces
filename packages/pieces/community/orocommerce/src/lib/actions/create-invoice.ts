import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  oroAuth,
  oroApiCall,
  customerDropdown,
  customerUserDropdown,
  invoiceInternalStatusDropdown,
  organizationDropdown,
  ownerDropdown,
  websiteDropdown
} from '../common';
import { OroAuth } from '../common/types';

export const createInvoiceAction = createAction({
  auth: oroAuth,
  name: 'create_invoice',
  displayName: 'Create Invoice',
  description: 'Creates a new invoice record in OroCommerce.',
  props: {
    invoiceDate: Property.ShortText({
      displayName: 'Invoice Date',
      description: 'Invoice date in YYYY-MM-DD format.',
      required: true,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'ISO-4217 3-letter currency code (e.g. USD, EUR).',
      required: true,
      defaultValue: 'USD',
    }),
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description:
        'Name of the company being billed. Stored as a plain-text label on the invoice.',
      required: true,
    }),
    customer: customerDropdown,
    customerId: Property.ShortText({
      displayName: 'Customer: Raw ID',
      description:
        'Overrides the Customer dropdown. Paste an ID from a previous step.',
      required: false,
    }),
    customerUser: customerUserDropdown(false),
    customerUserId: Property.ShortText({
      displayName: 'Customer User: Raw ID',
      description: 'Overrides the Customer User dropdown.',
      required: false,
    }),
    refCustomerId: Property.ShortText({
      displayName: 'External Customer ID',
      description:
        'An optional ID reference to a customer. Can be used for storing an arbitrary external ID.',
      required: false,
    }),
    refCustomerUserId: Property.ShortText({
      displayName: 'External Customer User ID',
      description:
        'An optional ID reference to a customer user. Can be used for storing an arbitrary external ID.',
      required: false,
    }),
    totalAmount: Property.Number({
      displayName: 'Total Amount',
      description:
        'Total invoice amount. Should equal the sum of all line item row totals.',
      required: true,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description:
        'Sequential invoice number (e.g. INV-2026-00001). Auto-generated if left empty.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Alternative invoice title that reflects its nature.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Internal description of the invoice.',
      required: false,
    }),
    memo: Property.ShortText({
      displayName: 'Memo',
      description: 'Short memo visible on the invoice (e.g. "Thank you!").',
      required: false,
    }),
    billTo: Property.LongText({
      displayName: 'Bill To',
      description:
        'Billing address HTML string (e.g. <strong>123 Main St</strong>, City, Country).',
      required: false,
    }),
    shipTo: Property.LongText({
      displayName: 'Ship To',
      description: 'Shipping address HTML string.',
      required: false,
    }),
    shippingMethod: Property.ShortText({
      displayName: 'Shipping Method',
      description:
        'Shipping method label (e.g. "International Shipping <em>(Tracking #: 123)</em>").',
      required: false,
    }),
    sellerInfo: Property.LongText({
      displayName: 'Seller Info',
      description: 'Seller contact / address HTML string.',
      required: false,
    }),
    externalPaymentUrl: Property.ShortText({
      displayName: 'External Payment URL',
      description: 'URL for the external payment page.',
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
    internalStatus: invoiceInternalStatusDropdown,
    internalStatusId: Property.ShortText({
      displayName: 'Internal Status: Raw ID',
      description:
        'Overrides the Internal Status dropdown (e.g. draft, open, paid).',
      required: false,
    }),

    // -- Line Items ------------------------------------------------------------
    // DynamicProperties lets us load product units once as StaticDropdown.
    // Products are entered as SKU/ID text (framework does not support Dropdown inside Array).
    lineItems: Property.DynamicProperties({
      auth: oroAuth,
      displayName: 'Line Items',
      description:
        'Invoice line items. Each item is sent via JSON:API included.',
      required: true,
      refreshers: [],
      props: async ({ auth }) => {
        type JsonApiCollection = {
          data: { id: string; attributes: Record<string, unknown> }[];
        };
        const unitOptions: { label: string; value: string }[] = [];

        if (auth) {
          try {
            const unitsResp = await oroApiCall({
              method: HttpMethod.GET,
              resourceUri: '/productunits',
              auth: auth as OroAuth,
              queryParams: { 'page[size]': '100' },
            });
            for (const item of (unitsResp.body as JsonApiCollection).data ??
              []) {
              unitOptions.push({
                label: String(item.attributes['label'] || item.id),
                value: item.id,
              });
            }
          } catch {
            /* leave empty */
          }
        }

        return {
          lineItems: Property.Array({
            displayName: 'Line Items',
            required: true,
            properties: {
              lineNumber: Property.ShortText({
                displayName: 'Line Number',
                description: 'Display line number (e.g. 1.1, 1.2).',
                required: false,
              }),
              description: Property.ShortText({
                displayName: 'Description',
                description: 'Line item description (HTML allowed).',
                required: true,
              }),
              productSku: Property.ShortText({
                displayName: 'Product SKU or ID',
                description:
                  'Enter the product SKU or numeric ID. Use the top-level "Product (Search)" field to look up products.',
                required: false,
              }),
              productUnit: Property.StaticDropdown({
                displayName: 'Product Unit',
                description: 'Unit of measurement (e.g. piece, kg, set).',
                required: false,
                options: { disabled: false, options: unitOptions },
              }),
              productUnitId: Property.ShortText({
                displayName: 'Product Unit: Raw ID',
                description:
                  'Overrides the Product Unit dropdown (e.g. "piece", "kg").',
                required: false,
              }),
              quantity: Property.Number({
                displayName: 'Quantity',
                description: 'Quantity of the item.',
                required: true,
              }),
              unitPrice: Property.Number({
                displayName: 'Unit Price',
                description: 'Price per unit.',
                required: true,
              }),
              rowTotal: Property.Number({
                displayName: 'Row Total',
                description:
                  'Total amount for this line (quantity × unit price).',
                required: true,
              }),
              note: Property.ShortText({
                displayName: 'Note',
                description: 'Additional note for this line item.',
                required: false,
              }),
            },
          }),
        };
      },
    }),
  },

  async run(context) {
    const p = context.propsValue;

    // raw ID takes priority over dropdown selection when both are present
    const resolve = (
      rawId: string | null | undefined,
      dropdownVal: unknown
    ): string | null => {
      const raw = rawId?.trim();
      if (raw) return raw;
      if (dropdownVal != null && String(dropdownVal).trim())
        return String(dropdownVal).trim();
      return null;
    };

    // -- Build included line items with string IDs --------------------------
    // DynamicProperties wraps the array in an object keyed by "lineItems"
    const dynamicValue = (p.lineItems ?? {}) as Record<string, unknown>;
    const rawItems = (dynamicValue['lineItems'] ?? []) as Array<
      Record<string, unknown>
    >;

    const included = rawItems.map((item, index) => {
      const productSku = (item['productSku'] as string | undefined)?.trim();
      const productUnitId =
        (item['productUnitId'] as string | undefined)?.trim() ||
        (item['productUnit'] as string | undefined);

      const attrs: Record<string, unknown> = {
        position: index + 1,
        lineNumber: item['lineNumber'] || String(index + 1),
        description: item['description'],
        quantity: Number(item['quantity']),
        unitPrice: Number(item['unitPrice']),
        rowTotal: Number(item['rowTotal']),
      };
      if (item['note']) attrs['note'] = item['note'];

      const liRels: Record<string, unknown> = {};
      if (productSku) {
        liRels['product'] = { data: { type: 'products', id: productSku } };
      }
      if (productUnitId) {
        liRels['productUnit'] = {
          data: { type: 'productunits', id: productUnitId },
        };
      }

      return {
        type: 'invoicelineitems',
        id: `li_${index + 1}`,
        attributes: attrs,
        ...(Object.keys(liRels).length > 0 ? { relationships: liRels } : {}),
      };
    });

    const lineItemsRelData = included.map((li) => ({
      type: 'invoicelineitems',
      id: li.id,
    }));

    // -- Build attributes ---------------------------------------------------
    const attributes: Record<string, unknown> = {
      invoiceDate: p.invoiceDate,
      currency: p.currency,
      customerName: p.customerName,
      totalAmount: p.totalAmount,
    };
    if (p.invoiceNumber) attributes['invoiceNumber'] = p.invoiceNumber;
    if (p.title) attributes['title'] = p.title;
    if (p.description) attributes['description'] = p.description;
    if (p.memo) attributes['memo'] = p.memo;
    if (p.billTo) attributes['billTo'] = p.billTo;
    if (p.shipTo) attributes['shipTo'] = p.shipTo;
    if (p.shippingMethod) attributes['shippingMethod'] = p.shippingMethod;
    if (p.sellerInfo) attributes['sellerInfo'] = p.sellerInfo;
    if (p.externalPaymentUrl)
      attributes['externalPaymentUrl'] = p.externalPaymentUrl;

    // -- Build relationships ------------------------------------------------
    const relationships: Record<string, unknown> = {
      lineItems: { data: lineItemsRelData },
    };

    const customerId = resolve(p.customerId, p.customer);
    if (customerId) {
      relationships['customer'] = {
        data: { type: 'customers', id: customerId },
      };
    }

    const customerUserId = resolve(p.customerUserId, p.customerUser);
    if (customerUserId) {
      relationships['customer_user'] = {
        data: { type: 'customerusers', id: customerUserId },
      };
    }

    const organizationId = resolve(p.organizationId, p.organization);
    if (organizationId) {
      relationships['organization'] = {
        data: { type: 'organizations', id: organizationId },
      };
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
      relationships['internal_status'] = {
        data: { type: 'invoiceinternalstatuses', id: internalStatusId },
      };
    }

    // -- POST /invoices -----------------------------------------------------
    const response = await oroApiCall({
      method: HttpMethod.POST,
      resourceUri: '/invoices',
      auth: context.auth,
      body: {
        data: {
          type: 'invoices',
          attributes,
          relationships,
        },
        included,
      },
    });

    return response.body;
  },
});
