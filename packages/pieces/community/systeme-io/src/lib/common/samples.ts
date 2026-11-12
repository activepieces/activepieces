export const contactSample = {
  id: 12345,
  email: 'email@example.com',
  registeredAt: '2024-01-01T00:00:00+00:00',
  locale: 'en',
  sourceURL: null,
  unsubscribed: false,
  bounced: false,
  needsConfirmation: false,
  fields: [
    { fieldName: 'First name', slug: 'first_name', value: 'John' },
    { fieldName: 'Last name', slug: 'surname', value: 'Doe' },
  ],
  tags: [
    { id: 1, name: 'some_tag' },
    { id: 2, name: 'another_tag' },
  ],
};

export const saleSample = {
  customer: {
    id: 12345,
    clientIp: 'dbad:0dad:6d09:3123:548f:712b:96dc:62e5',
    contactId: 12345,
    email: 'email@example.com',
    fields: {
      company_name: 'Super company',
      postcode: '12345',
      phone_number: '1234567890',
      surname: 'Doe',
      country: 'US',
      first_name: 'John',
    },
    paymentProcessor: 'stripe',
    sourceUrl: 'https://example.com/some-page',
  },
  coupon: {
    innerName: 'Coupon 123',
    code: 'C123',
    discountAmount: 1234,
    discountType: 'fixed',
    expirationDate: '2025-02-07T12:34:56+00:00',
    limitOfUse: 12,
  },
  funnelStep: {
    id: 12345,
    name: 'Beautiful funnel step',
    type: 'offer-form',
    funnel: { id: 12345, name: 'Beautiful funnel' },
  },
  order: {
    id: 12345,
    createdAt: '2025-02-06T12:34:56+00:00',
    discountAmount: null,
    discountType: null,
    shippingFee: null,
    totalPrice: null,
    vat: null,
  },
  orderItem: {
    createdAt: '2025-02-06T12:34:56+00:00',
    id: 12345,
    resources: [
      {
        course: null,
        courseBundle: null,
        enrollmentAccessType: null,
        enrollmentDrippingAccessCourse: null,
        physicalProduct: { id: 12345, name: 'Marketeur Booster', options: [] },
        tag: null,
      },
    ],
  },
  pricePlan: {
    id: 94283,
    name: 'Custom price plan',
    type: 'one_shot',
    amount: 1234,
    currency: 'eur',
    innerName: 'PP1',
    recurringOptions: null,
    statementDescriptor: '',
  },
};
