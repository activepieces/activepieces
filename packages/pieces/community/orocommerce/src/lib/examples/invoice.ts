const invoiceData = {
  type: 'invoices',
  id: '1',
  attributes: {
    uuid: 'c194f5ca-8030-4efb-aaae-b4d1eb906b1a',
    invoiceNumber: 'INV-2026-02-00001',
    invoiceDate: '2026-02-03',
    currency: 'USD',
    totalAmount: '59.2100',
    customerName: 'Customer A',
    refCustomerId: null,
    refCustomerUserId: null,
    title: 'Sample Invoice',
    description: 'Sample prepaid service',
    memo: 'Thank you for choosing us!',
    billTo: '<strong>101 Pine St</strong>, Ogdenville, USA, <em>44556</em>',
    shipTo: '<strong>654 Elm St</strong>, Shelbyville, USA, <em>09876</em>',
    shippingMethod: 'International Shipping <em>(Tracking #: 901234)</em>',
    sellerInfo:
      '<strong>Charlie White</strong>, <em>101 Main St</em>, North Haverbrook, USA, <em>77889</em>',
    externalPaymentUrl: 'https://example.com/pay/123456790',
    createdAt: '2026-02-03T11:33:49Z',
    updatedAt: '2026-02-18T11:35:37Z',
    lastContactedDate: null,
    lastContactedDateIn: null,
    lastContactedDateOut: null,
    timesContacted: 0,
    timesContactedIn: 0,
    timesContactedOut: 0,
    paymentStatus: {
      code: 'refunded',
      label: 'Refunded',
      isForced: false,
    },
  },
  relationships: {
    lineItems: {
      data: [
        {
          type: 'invoicelineitems',
          id: '1',
        },
        {
          type: 'invoicelineitems',
          id: '2',
        },
        {
          type: 'invoicelineitems',
          id: '3',
        },
      ],
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
    customer: {
      data: null,
    },
    customer_user: {
      data: null,
    },
    website: {
      data: null,
    },
    invoiceDefaultPdfFile: {
      data: null,
    },
    orders: {
      data: [],
    },
    activityNotes: {
      data: [],
    },
    activityEmails: {
      data: [],
    },
    internal_status: {
      data: {
        type: 'invoiceinternalstatuses',
        id: 'draft',
      },
    },
  },
};

export const invoiceCreateData = {
  event: 'create',
  channel: 'invoice',
  data: invoiceData,
  timestamp: 1771523549,
};

export const invoiceUpdateData = {
  event: 'update',
  channel: 'invoice',
  data: invoiceData,
  timestamp: 1771527786,
};

export const invoiceDeleteData = {
  event: 'delete',
  channel: 'invoice',
  data: invoiceData,
  timestamp: 1771527301,
};
