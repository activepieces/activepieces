import { createQawafelEventTrigger } from '../common/webhooks';

export const newProduct = createQawafelEventTrigger({
  name: 'new_product',
  displayName: 'New Product Published',
  description:
    'Fires when a new product is created in Qawafel. Use it to mirror your catalog into Shopify, Salla, Zid, or your data warehouse.',
  event: 'product.created',
  sampleData: {
    id: 'prod_01jk5jtv3x6e5hjkfcwzvubejq',
    sku: 'SKU-001',
    name_en: 'Office Chair',
    name_ar: 'كرسي مكتبي',
    description_en: 'Ergonomic mesh chair',
    description_ar: 'كرسي شبكي مريح',
    type: 'sale',
    unit_price: '450.00',
    is_taxable: true,
    is_active: true,
    barcode: '5901234123457',
    supplier_id: null,
    external_ref: null,
    created_at: '2026-04-27T10:15:00Z',
    updated_at: '2026-04-27T10:15:00Z',
  },
});
