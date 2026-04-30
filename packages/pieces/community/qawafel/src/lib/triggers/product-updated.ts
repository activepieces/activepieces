import { createQawafelEventTrigger } from '../common/webhooks';

export const productUpdated = createQawafelEventTrigger({
  name: 'product_updated',
  displayName: 'Product Updated',
  description:
    'Fires when a product is updated (price change, description edit, activated/deactivated). Use it to keep external storefronts in sync.',
  event: 'product.updated',
  sampleData: {
    id: 'prod_01jk5jtv3x6e5hjkfcwzvubejq',
    sku: 'SKU-001',
    name_en: 'Office Chair',
    name_ar: 'كرسي مكتبي',
    type: 'sale',
    unit_price: '475.00',
    is_taxable: true,
    is_active: true,
    barcode: '5901234123457',
    supplier_id: null,
    external_ref: null,
    created_at: '2026-04-20T10:15:00Z',
    updated_at: '2026-04-27T10:15:00Z',
  },
});
