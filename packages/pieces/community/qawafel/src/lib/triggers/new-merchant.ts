import { createQawafelEventTrigger } from '../common/webhooks';

export const newMerchant = createQawafelEventTrigger({
  name: 'new_merchant',
  displayName: 'New Merchant Registered',
  description:
    'Fires when a new merchant (customer or supplier) is created in Qawafel. Use it to onboard customers in your CRM or add suppliers to your procurement system.',
  event: 'merchant.created',
  sampleData: {
    id: 'mer_01jk5jtv3x2zbdroz75n3eczi4',
    legal_name: 'Acme Trading Co.',
    name_en: 'Acme',
    name_ar: 'أكمي',
    type: 'customer',
    email: 'orders@acme.example',
    phone: '+966500000000',
    cr_number: '1010000001',
    vat_number: '300000000000003',
    unified_national_number: '7000000001',
    is_taxable: true,
    is_active: true,
    address: {
      address_line: 'King Fahd Road',
      city: 'Riyadh',
      country: 'SA',
      postal_code: '12345',
    },
    external_ref: null,
    created_at: '2026-04-27T10:15:00Z',
    updated_at: '2026-04-27T10:15:00Z',
  },
});
