import { describe, expect, it } from 'vitest';
import { sallaProducts } from '../src/lib/common/products';

describe('flattenCategories', () => {
  const tree: unknown[] = [
    {
      id: 1,
      name: 'Clothes',
      parent_id: 0,
      status: 'active',
      sort_order: 1,
      image: 'https://cdn.example.com/c.png',
      urls: { customer: 'https://store.example.com/clothes' },
      sub_categories: [
        { id: 2, name: 'Shirts', parent_id: 1, sub_categories: [{ id: 3, name: ' Polo ' }] },
        { id: '4', name: 'Pants' },
      ],
    },
    { id: 2, name: 'Shirts again' },
    { id: 5, name: '' },
    { name: 'No ID' },
    'junk',
  ];

  it('flattens the tree with full paths, parents and depth, de-duplicated by id', () => {
    expect(sallaProducts.flattenCategories(tree)).toEqual([
      {
        id: 1,
        name: 'Clothes',
        path: 'Clothes',
        parent_id: null,
        depth: 0,
        status: 'active',
        sort_order: 1,
        image: 'https://cdn.example.com/c.png',
        url: 'https://store.example.com/clothes',
      },
      { id: 2, name: 'Shirts', path: 'Clothes > Shirts', parent_id: 1, depth: 1, status: null, sort_order: null, image: null, url: null },
      { id: 3, name: 'Polo', path: 'Clothes > Shirts > Polo', parent_id: 2, depth: 2, status: null, sort_order: null, image: null, url: null },
      { id: 4, name: 'Pants', path: 'Clothes > Pants', parent_id: 1, depth: 1, status: null, sort_order: null, image: null, url: null },
      { id: 5, name: '5', path: '5', parent_id: null, depth: 0, status: null, sort_order: null, image: null, url: null },
    ]);
  });

  it('keeps an explicit parent_id on a top-level child and stops at the depth cap', () => {
    expect(sallaProducts.flattenCategories([{ id: 9, name: 'Child', parent_id: '1' }])[0]).toMatchObject({ parent_id: 1, depth: 0, path: 'Child' });
    let node: Record<string, unknown> = { id: 100, name: 'L12' };
    for (let level = 11; level >= 0; level -= 1) {
      node = { id: level + 1, name: `L${level}`, sub_categories: [node] };
    }
    const flat = sallaProducts.flattenCategories([node]);
    expect(flat).toHaveLength(11);
    expect(flat[flat.length - 1].depth).toBe(10);
  });

  it('returns an empty list for an empty tree', () => {
    expect(sallaProducts.flattenCategories([])).toEqual([]);
  });
});

describe('withProductExtras', () => {
  const fullProduct = {
    id: 1025569331,
    name: 'Shirt',
    sku: 'TS-1',
    urls: { customer: 'https://store.example.com/p1', admin: 'https://s.salla.sa/products/1025569331' },
    price: { amount: 299, currency: 'SAR' },
    taxed_price: { amount: 343.85, currency: 'SAR' },
    regular_price: { amount: 299, currency: 'SAR' },
    sale_price: { amount: 0, currency: 'SAR' },
    sale_end: null,
    cost_price: null,
    status: 'hidden',
    main_image: null,
    thumbnail: 'https://cdn.example.com/thumb.jpg',
    images: [],
    brand: { id: 77, name: 'Acme' },
    categories: [
      { id: 12, name: 'Clothes' },
      { id: 13, name: 'Shirts' },
      'junk',
    ],
    updated_at: '2023-04-17 12:14:21',
  };

  it('adds flat keys on the full product shape and keeps the raw fields', () => {
    const result = sallaProducts.withProductExtras(fullProduct);
    expect(result).toMatchObject({
      price_amount: 299,
      sale_price_amount: null,
      regular_price_amount: 299,
      taxed_price_amount: 343.85,
      cost_price_amount: null,
      currency: 'SAR',
      sale_end_date: null,
      main_image_url: 'https://cdn.example.com/thumb.jpg',
      customer_url: 'https://store.example.com/p1',
      admin_url: 'https://s.salla.sa/products/1025569331',
      brand_id: 77,
      brand_name: 'Acme',
      category_ids: [12, 13],
      category_names: 'Clothes, Shirts',
      updated_at_iso: '2023-04-17T09:14:21.000Z',
    });
    expect(result['price']).toEqual({ amount: 299, currency: 'SAR' });
    expect(result['id']).toBe(1025569331);
  });

  it('picks the main image from images[] when main_image and thumbnail are missing', () => {
    const result = sallaProducts.withProductExtras({
      id: 1,
      images: [{ url: 'https://cdn.example.com/1.jpg' }, { url: 'https://cdn.example.com/2.jpg', main: true }],
      url: 'https://store.example.com/p1',
    });
    expect(result['main_image_url']).toBe('https://cdn.example.com/2.jpg');
    expect(result['customer_url']).toBe('https://store.example.com/p1');
    expect(sallaProducts.withProductExtras({ main_image: 'https://cdn.example.com/m.jpg' })['main_image_url']).toBe('https://cdn.example.com/m.jpg');
    expect(sallaProducts.withProductExtras({ sale_end: { date: '2026-12-01 00:00:00' } })['sale_end_date']).toBe('2026-12-01 00:00:00');
  });

  it('reads the thin product.price.updated payload', () => {
    const result = sallaProducts.withProductExtras({
      id: 1462551237,
      sku: 'PRO-7644',
      mpn: 'MPN888',
      gtin: '38374622',
      cost: 60,
      starting_price: null,
      price: 150,
      sale_price: { amount: 85, expired_at: '2025-12-01' },
      tax: 22.5,
      taxed_price: 172.5,
      regular_price: 150,
      currency: 'SAR',
      with_tax: true,
    });
    expect(result).toMatchObject({
      price_amount: 150,
      sale_price_amount: 85,
      regular_price_amount: 150,
      taxed_price_amount: 172.5,
      cost_price_amount: 60,
      currency: 'SAR',
      sale_end_date: '2025-12-01',
      main_image_url: null,
      customer_url: null,
      admin_url: null,
      brand_id: null,
      brand_name: null,
      category_ids: [],
      category_names: null,
      updated_at_iso: null,
      sku: 'PRO-7644',
    });
  });

  it('reads the thin product.status.updated payload', () => {
    const result = sallaProducts.withProductExtras({ id: 799860060, sku: 'SKU122', mpn: 'MPN-093', gtin: '88840002', status: 'hidden' });
    expect(result).toEqual({
      price_amount: null,
      sale_price_amount: null,
      regular_price_amount: null,
      taxed_price_amount: null,
      cost_price_amount: null,
      currency: null,
      sale_end_date: null,
      main_image_url: null,
      customer_url: null,
      admin_url: null,
      brand_id: null,
      brand_name: null,
      category_ids: [],
      category_names: null,
      updated_at_iso: null,
      id: 799860060,
      sku: 'SKU122',
      mpn: 'MPN-093',
      gtin: '88840002',
      status: 'hidden',
    });
  });

  it('turns quantities Salla sends as text into numbers, leaving other text alone', () => {
    const result = sallaProducts.withProductExtras({
      id: 1,
      quantity: '50',
      notify_quantity: '10',
      sold_quantity: '1',
      maximum_quantity_per_order: 3,
      weight: 'heavy',
      skus: [{ id: 11, stock_quantity: '0' }, { id: 12, stock_quantity: 5 }, 'junk'],
    });
    expect(result).toMatchObject({
      quantity: 50,
      notify_quantity: 10,
      sold_quantity: 1,
      maximum_quantity_per_order: 3,
      weight: 'heavy',
      skus: [{ id: 11, stock_quantity: 0 }, { id: 12, stock_quantity: 5 }, 'junk'],
    });
  });

  it('returns {} for a non-object', () => {
    expect(sallaProducts.withProductExtras(undefined)).toEqual({});
    expect(sallaProducts.withProductExtras([1])).toEqual({});
  });
});

describe('withVariantExtras', () => {
  const optionNames = new Map([
    ['101', 'Red'],
    ['201', 'M'],
  ]);

  it('labels a variant from its option values and SKU', () => {
    const result = sallaProducts.withVariantExtras({
      variant: {
        id: 11,
        sku: 'TS-RED-M',
        related_option_values: [101, '201', null],
        price: { amount: 120, currency: 'SAR' },
        sale_price: { amount: 100, currency: 'SAR' },
        regular_price: { amount: 120, currency: 'SAR' },
        cost_price: { amount: 50, currency: 'SAR' },
        stock_quantity: '7',
        updated_at: '2026-11-01 10:00:00',
      },
      optionNames,
      productId: 5,
    });
    expect(result).toMatchObject({
      label: 'Red / M · TS-RED-M',
      option_values: 'Red / M',
      product_id: 5,
      price_amount: 120,
      sale_price_amount: 100,
      regular_price_amount: 120,
      cost_price_amount: 50,
      currency: 'SAR',
      stock_quantity_number: 7,
      updated_at_iso: '2026-11-01T07:00:00.000Z',
      id: 11,
    });
  });

  it('falls back to "Variant {id}" and nulls when nothing is known', () => {
    expect(sallaProducts.withVariantExtras({ variant: { id: 12, related_option_values: ['999'], sku: '' } })).toMatchObject({
      label: 'Variant 12',
      option_values: null,
      product_id: null,
      price_amount: null,
      currency: undefined,
      stock_quantity_number: null,
    });
    expect(sallaProducts.withVariantExtras({ variant: { id: 13, sku: 'S-1' }, optionNames })['label']).toBe('Variant 13 · S-1');
    expect(sallaProducts.withVariantExtras({ variant: 'junk' })).toEqual({});
  });

  it('turns a text low-stock threshold and weight into numbers', () => {
    expect(sallaProducts.withVariantExtras({ variant: { id: 14, notify_low: '3', weight: '0.5' } })).toMatchObject({ notify_low: 3, weight: 0.5 });
  });
});

describe('withImageExtras', () => {
  it('flattens the nested image URLs', () => {
    const image = { id: 9, image: { original: { url: 'https://cdn.example.com/o.jpg' }, thumbnail: { url: 'https://cdn.example.com/t.jpg' } }, sort: 1 };
    expect(sallaProducts.withImageExtras({ image, productId: 5 })).toEqual({
      product_id: 5,
      url: 'https://cdn.example.com/o.jpg',
      thumbnail_url: 'https://cdn.example.com/t.jpg',
      ...image,
    });
  });

  it('falls back to a top-level url and handles a missing image', () => {
    expect(sallaProducts.withImageExtras({ image: { id: 9, url: 'https://cdn.example.com/u.jpg' }, productId: 5 })).toMatchObject({
      url: 'https://cdn.example.com/u.jpg',
      thumbnail_url: null,
    });
    expect(sallaProducts.withImageExtras({ image: undefined, productId: 5 })).toEqual({ product_id: 5 });
  });
});
