export const orderCreateData = {
  event: 'create',
  channel: 'order',
  data: {
    type: 'orders',
    id: '48',
    attributes: {
      identifier: '48',
      poNumber: 'PONUM111222334',
      customerNotes: 'Customer Notes',
      shipUntil: {
        date: '2026-02-27 00:00:00.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      currency: 'USD',
      subtotalWithDiscountsValue: '79.9900',
      subtotalWithDiscounts: '79.9900',
      subtotalValue: '79.9900',
      totalValue: '89.9900',
      shippingMethod: 'fixed_product_6',
      shippingMethodType: 'primary',
      estimatedShippingCostAmount: '10.0000',
      overriddenShippingCostAmount: null,
      sourceEntityIdentifier: null,
      totalDiscountsAmount: null,
      external: false,
      createdAt: {
        date: '2026-02-19 19:40:25.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      updatedAt: {
        date: '2026-02-19 19:40:25.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      lastContactedDate: null,
      lastContactedDateIn: null,
      lastContactedDateOut: null,
      timesContacted: null,
      timesContactedIn: null,
      timesContactedOut: null,
      disablePromotions: false,
      discount: 0,
      shippingDiscount: 0,
    },
    relationships: {
      createdBy: {
        data: {
          type: 'users',
          id: '1',
        },
      },
      billingAddress: {
        data: {
          type: 'orderaddresses',
          id: '86',
        },
      },
      shippingAddress: {
        data: {
          type: 'orderaddresses',
          id: '87',
        },
      },
      website: {
        data: {
          type: 'websites',
          id: '1',
        },
      },
      lineItems: {
        data: [
          {
            type: 'orderlineitems',
            id: '129',
          },
        ],
      },
      discounts: {
        data: [],
      },
      shippingTrackings: {
        data: [],
      },
      parent: {
        data: null,
      },
      subOrders: {
        data: [],
      },
      owner: {
        data: {
          type: 'users',
          id: '1',
        },
      },
      organization: {
        data: {
          type: 'organizations',
          id: '1',
        },
      },
      customerUser: {
        data: {
          type: 'customerusers',
          id: '1',
        },
      },
      customer: {
        data: {
          type: 'customers',
          id: '5',
        },
      },
      paymentTerm: {
        data: {
          type: 'paymentterms',
          id: '1',
        },
      },
      invoices: {
        data: [],
      },
      warehouse: {
        data: {
          type: 'warehouses',
          id: '1',
        },
      },
      source: {
        data: null,
      },
      internalStatus: {
        data: {
          type: 'orderinternalstatuses',
          id: 'order_internal_status.open',
        },
      },
      orderSubtotals: {
        data: [
          {
            type: 'ordersubtotals',
            id: '48-subtotal-0',
          },
          {
            type: 'ordersubtotals',
            id: '48-discount-1',
          },
          {
            type: 'ordersubtotals',
            id: '48-shipping_cost-2',
          },
          {
            type: 'ordersubtotals',
            id: '48-discount-3',
          },
          {
            type: 'ordersubtotals',
            id: '48-tax-4',
          },
          {
            type: 'ordersubtotals',
            id: '48-tax-5',
          },
          {
            type: 'ordersubtotals',
            id: '48-tax-6',
          },
        ],
      },
      attachments: {
        data: [],
      },
      documents: {
        data: [
          {
            type: 'files',
            id: '661',
            meta: {
              sortOrder: 1,
            },
          },
        ],
      },
      activityNotes: {
        data: [],
      },
      activityEmails: {
        data: [],
      },
      status: {
        data: null,
      },
      shippingStatus: {
        data: {
          type: 'ordershippingstatuses',
          id: 'order_shipping_status.not_shipped',
        },
      },
    },
  },
  timestamp: 1771530026,
};

export const orderUpdateData = {
  event: 'update',
  channel: 'order',
  data: {
    type: 'orders',
    id: '42',
    attributes: {
      identifier: '42',
      poNumber: 'PONUM111222334',
      customerNotes: 'Order Customer Notes',
      shipUntil: {
        date: '2026-02-28 00:00:00.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      currency: 'USD',
      subtotalWithDiscountsValue: '236.9700',
      subtotalWithDiscounts: '236.9700',
      subtotalValue: '239.9700',
      totalValue: '246.9700',
      shippingMethod: 'fixed_product_6',
      shippingMethodType: 'primary',
      estimatedShippingCostAmount: '10.0000',
      overriddenShippingCostAmount: null,
      sourceEntityIdentifier: null,
      totalDiscountsAmount: '3.0000',
      external: false,
      createdAt: {
        date: '2026-02-19 17:52:28.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      updatedAt: {
        date: '2026-02-19 19:03:06.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      lastContactedDate: null,
      lastContactedDateIn: null,
      lastContactedDateOut: null,
      timesContacted: null,
      timesContactedIn: null,
      timesContactedOut: null,
      disablePromotions: false,
      discount: 0,
      shippingDiscount: 0,
    },
    relationships: {
      createdBy: {
        data: {
          type: 'users',
          id: '1',
        },
      },
      billingAddress: {
        data: {
          type: 'orderaddresses',
          id: '74',
        },
      },
      shippingAddress: {
        data: {
          type: 'orderaddresses',
          id: '75',
        },
      },
      website: {
        data: {
          type: 'websites',
          id: '1',
        },
      },
      lineItems: {
        data: [
          {
            type: 'orderlineitems',
            id: '123',
          },
        ],
      },
      discounts: {
        data: [
          {
            type: 'orderdiscounts',
            id: '1',
          },
        ],
      },
      shippingTrackings: {
        data: [],
      },
      parent: {
        data: null,
      },
      subOrders: {
        data: [],
      },
      owner: {
        data: {
          type: 'users',
          id: '1',
        },
      },
      organization: {
        data: {
          type: 'organizations',
          id: '1',
        },
      },
      customerUser: {
        data: {
          type: 'customerusers',
          id: '1',
        },
      },
      customer: {
        data: {
          type: 'customers',
          id: '5',
        },
      },
      paymentTerm: {
        data: {
          type: 'paymentterms',
          id: '1',
        },
      },
      invoices: {
        data: [],
      },
      warehouse: {
        data: {
          type: 'warehouses',
          id: '1',
        },
      },
      source: {
        data: null,
      },
      internalStatus: {
        data: {
          type: 'orderinternalstatuses',
          id: 'order_internal_status.open',
        },
      },
      orderSubtotals: {
        data: [
          {
            type: 'ordersubtotals',
            id: '42-subtotal-0',
          },
          {
            type: 'ordersubtotals',
            id: '42-discount-1',
          },
          {
            type: 'ordersubtotals',
            id: '42-discount-2',
          },
          {
            type: 'ordersubtotals',
            id: '42-shipping_cost-3',
          },
          {
            type: 'ordersubtotals',
            id: '42-discount-4',
          },
          {
            type: 'ordersubtotals',
            id: '42-tax-5',
          },
          {
            type: 'ordersubtotals',
            id: '42-tax-6',
          },
          {
            type: 'ordersubtotals',
            id: '42-tax-7',
          },
        ],
      },
      attachments: {
        data: [],
      },
      documents: {
        data: [
          {
            type: 'files',
            id: '656',
            meta: {
              sortOrder: 1,
            },
          },
        ],
      },
      activityNotes: {
        data: [],
      },
      activityEmails: {
        data: [],
      },
      status: {
        data: null,
      },
      shippingStatus: {
        data: {
          type: 'ordershippingstatuses',
          id: 'order_shipping_status.not_shipped',
        },
      },
    },
  },
  timestamp: 1771527786,
};

export const orderDeleteData = {
  event: 'delete',
  channel: 'order',
  data: {
    type: 'orders',
    id: '20',
    attributes: {
      identifier: 'FR1012408',
      poNumber: 'RT104568EUR',
      customerNotes: null,
      shipUntil: {
        date: '2026-02-18 00:00:00.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      currency: 'USD',
      subtotalWithDiscountsValue: '33951.0000',
      subtotalWithDiscounts: '33951.0000',
      subtotalValue: '33951.0000',
      totalValue: '33951.0000',
      shippingMethod: null,
      shippingMethodType: null,
      estimatedShippingCostAmount: null,
      overriddenShippingCostAmount: null,
      sourceEntityIdentifier: null,
      totalDiscountsAmount: null,
      external: false,
      createdAt: {
        date: '2025-12-19 21:04:00.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      updatedAt: {
        date: '2026-02-18 11:35:37.000000',
        timezone_type: 3,
        timezone: 'UTC',
      },
      lastContactedDate: null,
      lastContactedDateIn: null,
      lastContactedDateOut: null,
      timesContacted: 0,
      timesContactedIn: 0,
      timesContactedOut: 0,
      disablePromotions: false,
      discount: 0,
      shippingDiscount: 0,
    },
    relationships: {
      createdBy: {
        data: {
          type: 'users',
          id: '4',
        },
      },
      billingAddress: {
        data: {
          type: 'orderaddresses',
          id: '27',
        },
      },
      shippingAddress: {
        data: {
          type: 'orderaddresses',
          id: '28',
        },
      },
      website: {
        data: {
          type: 'websites',
          id: '1',
        },
      },
      lineItems: {
        data: [
          {
            type: 'orderlineitems',
            id: '65',
          },
          {
            type: 'orderlineitems',
            id: '66',
          },
          {
            type: 'orderlineitems',
            id: '67',
          },
        ],
      },
      discounts: {
        data: [],
      },
      shippingTrackings: {
        data: [],
      },
      parent: {
        data: null,
      },
      subOrders: {
        data: [],
      },
      owner: {
        data: {
          type: 'users',
          id: '21',
        },
      },
      organization: {
        data: {
          type: 'organizations',
          id: '1',
        },
      },
      customerUser: {
        data: {
          type: 'customerusers',
          id: '11',
        },
      },
      customer: {
        data: {
          type: 'customers',
          id: '11',
        },
      },
      paymentTerm: {
        data: {
          type: 'paymentterms',
          id: '3',
        },
      },
      invoices: {
        data: [
          {
            type: 'invoices',
            id: '20',
          },
        ],
      },
      warehouse: {
        data: null,
      },
      source: {
        data: null,
      },
      internalStatus: {
        data: {
          type: 'orderinternalstatuses',
          id: 'order_internal_status.open',
        },
      },
      orderSubtotals: {
        data: [
          {
            type: 'ordersubtotals',
            id: '20-subtotal-0',
          },
          {
            type: 'ordersubtotals',
            id: '20-discount-1',
          },
          {
            type: 'ordersubtotals',
            id: '20-shipping_cost-2',
          },
          {
            type: 'ordersubtotals',
            id: '20-discount-3',
          },
          {
            type: 'ordersubtotals',
            id: '20-tax-4',
          },
          {
            type: 'ordersubtotals',
            id: '20-tax-5',
          },
          {
            type: 'ordersubtotals',
            id: '20-tax-6',
          },
        ],
      },
      attachments: {
        data: [],
      },
      documents: {
        data: [],
      },
      activityNotes: {
        data: [],
      },
      activityEmails: {
        data: [],
      },
      status: {
        data: null,
      },
      shippingStatus: {
        data: {
          type: 'ordershippingstatuses',
          id: 'order_shipping_status.not_shipped',
        },
      },
    },
  },
  timestamp: 1771527301,
};
