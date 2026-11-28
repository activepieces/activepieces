import { describe, expect, it } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  CreateProductInput,
  ProductStatus,
  StockLineInput,
  UpdateProductInput,
  WeightType,
  sallaProducts,
} from '../src/lib/common/products';

function raw<T>(value: unknown): T {
  if (acceptsAnything<T>(value)) {
    return value;
  }
  throw new Error('unreachable');
}

function acceptsAnything<T>(value: unknown): value is T {
  return value !== undefined || value === undefined;
}

function baseCreate(overrides: Partial<CreateProductInput> = {}): CreateProductInput {
  return { name: ' T-Shirt ', productType: 'product', price: '99.5', ...overrides };
}

function stockLine(overrides: Partial<StockLineInput> = {}): StockLineInput {
  return { identifierType: 'id', identifier: '1764656014', quantity: 5, mode: 'increment', ...overrides };
}

function fileOf(entry: FormDataEntryValue | null): File {
  if (!(entry instanceof File)) {
    throw new Error('expected a file entry');
  }
  return entry;
}

describe('buildCreateProductBody', () => {
  it('builds the required fields only, trimmed and typed', () => {
    expect(sallaProducts.buildCreateProductBody(baseCreate())).toEqual({ name: 'T-Shirt', product_type: 'product', price: 99.5 });
  });

  it('accepts a numeric price, zero and Arabic-Indic digits', () => {
    expect(sallaProducts.buildCreateProductBody(baseCreate({ price: 120 }))['price']).toBe(120);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ price: 0 }))['price']).toBe(0);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ price: '٩٩' }))['price']).toBe(99);
  });

  it('enforces name, type and price with readable errors', () => {
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ name: '  ' }))).toThrow('Give the product a name.');
    const badType: string = 'gadget';
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ productType: raw<CreateProductInput['productType']>(badType) }))).toThrow(
      '"gadget" is not a Salla product type. Use one of: product, service, group_products, codes, digital, food, booking, donating.',
    );
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ price: '' }))).toThrow('Give the product a price, for example 99.5.');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ price: 'abc' }))).toThrow('Price must be a number, but got "abc".');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ price: -1 }))).toThrow('Price cannot be negative.');
  });

  it('validates the other numbers with the field name', () => {
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ salePrice: 'ten' }))).toThrow('Sale price must be a number');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ costPrice: -5 }))).toThrow('Cost price cannot be negative.');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ quantity: '2.5' }))).toThrow('Quantity must be a whole number, but got "2.5".');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ weight: 'heavy' }))).toThrow('Weight must be a number');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ maximumQuantityPerOrder: 1.5 }))).toThrow(
      'Maximum quantity per order must be a whole number',
    );
  });

  it('maps tri-state booleans: unchanged omits, yes/no become true/false', () => {
    const unchanged = sallaProducts.buildCreateProductBody(
      baseCreate({ requireShipping: 'unchanged', hideQuantity: 'unchanged', enableUploadImage: undefined, enableNote: null, unlimitedQuantity: 'unchanged' }),
    );
    expect(unchanged).toEqual({ name: 'T-Shirt', product_type: 'product', price: 99.5 });
    const set = sallaProducts.buildCreateProductBody(
      baseCreate({ requireShipping: 'yes', hideQuantity: 'no', enableUploadImage: true, enableNote: false, unlimitedQuantity: 'no' }),
    );
    expect(set).toMatchObject({
      require_shipping: true,
      hide_quantity: false,
      enable_upload_image: true,
      enable_note: false,
      unlimited_quantity: false,
    });
  });

  it('drops quantity when unlimited quantity is yes, and keeps it otherwise', () => {
    const unlimited = sallaProducts.buildCreateProductBody(baseCreate({ quantity: 5, unlimitedQuantity: 'yes' }));
    expect(unlimited).not.toHaveProperty('quantity');
    expect(unlimited['unlimited_quantity']).toBe(true);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ quantity: '7', unlimitedQuantity: 'no' }))).toMatchObject({
      quantity: 7,
      unlimited_quantity: false,
    });
    expect(sallaProducts.buildCreateProductBody(baseCreate({ quantity: 0 }))['quantity']).toBe(0);
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ quantity: 'lots', unlimitedQuantity: 'yes' }))).not.toThrow();
  });

  it('normalises sale dates to YYYY-MM-DD in the store timezone', () => {
    const body = sallaProducts.buildCreateProductBody(
      baseCreate({ salePrice: '80', saleStart: ' 2026-11-20T10:00:00 ', saleEnd: '2026-11-30T22:30:00Z' }),
    );
    expect(body).toMatchObject({ sale_price: 80, sale_start: '2026-11-20', sale_end: '2026-12-01' });
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ saleEnd: '2026-02-30' }))).toThrow('is not a valid date');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ saleStart: 'soon' }))).toThrow('"soon" is not a valid date');
  });

  it('turns an image URL list into images[] with the first one as default', () => {
    const expected = [
      { original: 'https://cdn.example.com/1.jpg', default: true, sort: 1 },
      { original: 'https://cdn.example.com/2.jpg', sort: 2 },
    ];
    const asArray = sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: [' https://cdn.example.com/1.jpg ', '', 'https://cdn.example.com/2.jpg'] }));
    const asComma = sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: 'https://cdn.example.com/1.jpg, https://cdn.example.com/2.jpg' }));
    const asJson = sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: '["https://cdn.example.com/1.jpg","https://cdn.example.com/2.jpg"]' }));
    expect(asArray['images']).toEqual(expected);
    expect(asComma['images']).toEqual(expected);
    expect(asJson['images']).toEqual(expected);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: [] }))).not.toHaveProperty('images');
    expect(sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: ' ' }))).not.toHaveProperty('images');
  });

  it('rejects an image that is not an http(s) URL', () => {
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: ['ftp://x/1.jpg'] }))).toThrow(
      '"ftp://x/1.jpg" is not an image URL. Use a full public link that starts with https://.',
    );
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: 'photo.jpg' }))).toThrow('is not an image URL');
  });

  it('allows up to 10 images and rejects more', () => {
    const urls = (count: number) => Array.from({ length: count }, (_, index) => `https://cdn.example.com/${index + 1}.jpg`);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: urls(10) }))['images']).toHaveLength(10);
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ imageUrls: urls(11) }))).toThrow(
      'Salla allows at most 10 images per product; you gave 11.',
    );
  });

  it('sends category IDs and the brand ID as numbers', () => {
    expect(sallaProducts.buildCreateProductBody(baseCreate({ categoryIds: ['12', 34], brandId: '٥٦' }))).toMatchObject({
      categories: [12, 34],
      brand_id: 56,
    });
    expect(sallaProducts.buildCreateProductBody(baseCreate({ categoryIds: '12, 34' }))['categories']).toEqual([12, 34]);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ categoryIds: '[12,"34"]' }))['categories']).toEqual([12, 34]);
    expect(sallaProducts.buildCreateProductBody(baseCreate({ categoryIds: [], brandId: '' }))).toEqual({
      name: 'T-Shirt',
      product_type: 'product',
      price: 99.5,
    });
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ categoryIds: ['shirts'] }))).toThrow('Category ID must be a numeric Salla ID');
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ brandId: 'nike' }))).toThrow('Brand ID must be a numeric Salla ID');
  });

  it('maps every text and metadata field to its Salla name', () => {
    const body = sallaProducts.buildCreateProductBody(
      baseCreate({
        status: 'sale',
        description: ' <p>Soft cotton</p> ',
        sku: ' TS-1 ',
        mpn: '0012',
        gtin: '00012345',
        weight: '0.4',
        weightType: 'kg',
        subtitle: 'New',
        promotionTitle: 'Promo',
        promotionSubtitle: 'Sub',
        metadataTitle: 'SEO title',
        metadataDescription: 'SEO description',
        metadataUrl: 'cotton-shirt',
        calories: 120,
        costPrice: '40',
        maximumQuantityPerOrder: '3',
      }),
    );
    expect(body).toEqual({
      name: 'T-Shirt',
      product_type: 'product',
      price: 99.5,
      status: 'sale',
      description: '<p>Soft cotton</p>',
      sku: 'TS-1',
      mpn: '0012',
      gtin: '00012345',
      weight: 0.4,
      weight_type: 'kg',
      subtitle: 'New',
      promotion_title: 'Promo',
      promotion_subtitle: 'Sub',
      metadata_title: 'SEO title',
      metadata_description: 'SEO description',
      metadata_url: 'cotton-shirt',
      calories: '120',
      cost_price: 40,
      maximum_quantity_per_order: 3,
    });
  });

  it('checks the status and weight unit', () => {
    const hidden: string = ' Hidden ';
    expect(sallaProducts.buildCreateProductBody(baseCreate({ status: raw<ProductStatus>(hidden) }))['status']).toBe('hidden');
    const draft: string = 'draft';
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ status: raw<ProductStatus>(draft) }))).toThrow('"draft" is not a product status');
    const empty: string = '';
    expect(sallaProducts.buildCreateProductBody(baseCreate({ status: raw<ProductStatus>(empty) }))).not.toHaveProperty('status');
    const stone: string = 'stone';
    expect(() => sallaProducts.buildCreateProductBody(baseCreate({ weightType: raw<WeightType>(stone) }))).toThrow(
      '"stone" is not a weight unit. Use one of: kg, g, lb, oz.',
    );
  });

  it('compacts empty strings and blanks out of the body', () => {
    const body = sallaProducts.buildCreateProductBody(
      baseCreate({
        description: ' ',
        sku: '',
        mpn: undefined,
        salePrice: '',
        saleStart: '',
        costPrice: ' ',
        quantity: '',
        weight: undefined,
        metadataTitle: '  ',
        calories: '',
        subtitle: '',
      }),
    );
    expect(body).toEqual({ name: 'T-Shirt', product_type: 'product', price: 99.5 });
  });
});

describe('buildUpdateProductBody', () => {
  it('sends only the given fields and never product_type', () => {
    const input: UpdateProductInput & { productType: string } = { productType: 'service', name: ' New name ', price: '10' };
    const body = sallaProducts.buildUpdateProductBody(input);
    expect(body).toEqual({ name: 'New name', price: 10 });
    expect(body).not.toHaveProperty('product_type');
  });

  it('throws when nothing is set to change', () => {
    expect(() => sallaProducts.buildUpdateProductBody({})).toThrow('Nothing to update. Fill at least one field to change on the product.');
    expect(() =>
      sallaProducts.buildUpdateProductBody({ name: ' ', price: '', unlimitedQuantity: 'unchanged', requireShipping: 'unchanged', categoryIds: [] }),
    ).toThrow('Nothing to update');
  });

  it('never sends images, even when image URLs are passed', () => {
    expect(sallaProducts.buildUpdateProductBody({ quantity: '4' })).toEqual({ quantity: 4 });
    const withImages: UpdateProductInput & { imageUrls: string } = { quantity: '4', imageUrls: 'https://cdn.example.com/a.png' };
    const body = sallaProducts.buildUpdateProductBody(withImages);
    expect(body).toEqual({ quantity: 4 });
    expect(body).not.toHaveProperty('images');
    const onlyImages: UpdateProductInput & { imageUrls: string[] } = { imageUrls: ['https://cdn.example.com/a.png'] };
    expect(() => sallaProducts.buildUpdateProductBody(onlyImages)).toThrow('Nothing to update');
  });

  it('accepts a tri-state no and a price of 0 as real changes', () => {
    expect(sallaProducts.buildUpdateProductBody({ requireShipping: 'no' })).toEqual({ require_shipping: false });
    expect(sallaProducts.buildUpdateProductBody({ price: 0 })).toEqual({ price: 0 });
  });

  it('validates numbers the same way as create', () => {
    expect(() => sallaProducts.buildUpdateProductBody({ price: 'free' })).toThrow('Price must be a number, but got "free".');
    expect(() => sallaProducts.buildUpdateProductBody({ quantity: -2 })).toThrow('Quantity cannot be negative.');
  });
});

describe('buildStockBody', () => {
  it('uses Salla\'s identifer_type / identifer spelling and always sends the mode', () => {
    const body = sallaProducts.buildStockBody({ lines: [stockLine()] });
    expect(body).toEqual({ products: [{ identifer_type: 'id', identifer: '1764656014', quantity: 5, mode: 'increment' }] });
    const line = body.products[0];
    expect(Object.keys(line)).toEqual(['identifer_type', 'identifer', 'quantity', 'mode']);
    expect(JSON.stringify(body)).not.toContain('identifier');
  });

  it('builds several lines with branch, reason and unlimited flag as typed values', () => {
    const body = sallaProducts.buildStockBody({
      lines: [
        stockLine({ identifierType: 'variant_id', identifier: 99, quantity: '3', mode: 'decrement', branchId: '7', reasonId: 12 }),
        stockLine({ identifierType: 'sku', identifier: ' TS-RED-M ', quantity: '10', mode: 'overwrite', unlimitedQuantity: 'no' }),
        stockLine({ unlimitedQuantity: 'unchanged', branchId: '', reasonId: undefined }),
      ],
    });
    expect(body.products).toEqual([
      { identifer_type: 'variant_id', identifer: '99', quantity: 3, mode: 'decrement', branch: 7, reason_id: 12 },
      { identifer_type: 'sku', identifer: 'TS-RED-M', quantity: 10, mode: 'overwrite', unlimited_quantity: false },
      { identifer_type: 'id', identifer: '1764656014', quantity: 5, mode: 'increment' },
    ]);
  });

  it('allows a quantity of 0 only with overwrite', () => {
    expect(sallaProducts.buildStockBody({ lines: [stockLine({ quantity: 0, mode: 'overwrite' })] }).products[0].quantity).toBe(0);
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ quantity: '0', mode: 'increment' })] })).toThrow(
      'Stock line 1: quantity must be greater than 0 when adding or removing stock.',
    );
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine(), stockLine({ quantity: 0, mode: 'decrement' })] })).toThrow('Stock line 2:');
  });

  it('requires a whole, non-negative quantity', () => {
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ quantity: '' })] })).toThrow(
      'Stock line 1: give the quantity, a whole number such as 5.',
    );
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ quantity: 1.5 })] })).toThrow('Stock line 1: Quantity must be a whole number');
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ quantity: -3 })] })).toThrow('Stock line 1: Quantity cannot be negative.');
  });

  it('validates numeric IDs for id and variant_id, but not for sku', () => {
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ identifier: 'TS-1' })] })).toThrow(
      'Stock line 1: Product ID must be a numeric Salla ID',
    );
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ identifierType: 'variant_id', identifier: 'v-1' })] })).toThrow(
      'Stock line 1: Variant ID must be a numeric Salla ID',
    );
    expect(sallaProducts.buildStockBody({ lines: [stockLine({ identifierType: 'sku', identifier: 'TS-1' })] }).products[0].identifer).toBe('TS-1');
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ identifierType: 'sku', identifier: ' ' })] })).toThrow('Stock line 1: give the product SKU');
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ branchId: 'main' })] })).toThrow('Stock line 1: Branch ID must be a numeric');
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ reasonId: 'x' })] })).toThrow('Stock line 1: Reason ID must be a numeric');
  });

  it('rejects an empty list, an unknown identifier type and an unknown mode', () => {
    expect(() => sallaProducts.buildStockBody({ lines: [] })).toThrow('Add at least one stock line');
    const barcode: string = 'barcode';
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ identifierType: raw<StockLineInput['identifierType']>(barcode) })] })).toThrow(
      'Stock line 1: "barcode" is not a valid identifier type. Use id, variant_id or sku.',
    );
    const set: string = 'set';
    expect(() => sallaProducts.buildStockBody({ lines: [stockLine({ mode: raw<StockLineInput['mode']>(set) })] })).toThrow(
      'Stock line 1: "set" is not a valid mode. Use increment, decrement or overwrite.',
    );
  });
});

describe('buildProductPriceRequest', () => {
  it('POSTs only the price to /products/sku/{sku}/price', () => {
    expect(sallaProducts.buildProductPriceRequest({ sku: ' TS-1 ', price: '120.5' })).toEqual({
      method: HttpMethod.POST,
      path: '/products/sku/TS-1/price',
      body: { price: 120.5 },
    });
  });

  it('falls back to PUT /products/sku/{sku} when a sale, cost or sale end is given', () => {
    expect(sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 100, salePrice: '80' })).toEqual({
      method: HttpMethod.PUT,
      path: '/products/sku/TS-1',
      body: { price: 100, sale_price: 80 },
    });
    expect(sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 100, costPrice: 60 }).body).toEqual({ price: 100, cost_price: 60 });
    expect(sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 100, saleEnd: '2026-12-31T23:00:00' })).toEqual({
      method: HttpMethod.PUT,
      path: '/products/sku/TS-1',
      body: { price: 100, sale_end: '2026-12-31' },
    });
    expect(sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 100, salePrice: '', costPrice: ' ', saleEnd: '' }).method).toBe(HttpMethod.POST);
  });

  it('URL-encodes the SKU', () => {
    expect(sallaProducts.buildProductPriceRequest({ sku: 'RED M/#1', price: 1 }).path).toBe('/products/sku/RED%20M%2F%231/price');
    expect(sallaProducts.buildProductPriceRequest({ sku: 'قميص', price: 1, salePrice: 0 }).path).toBe(`/products/sku/${encodeURIComponent('قميص')}`);
  });

  it('requires a SKU and a valid price', () => {
    expect(() => sallaProducts.buildProductPriceRequest({ sku: ' ', price: 1 })).toThrow('Give the product SKU');
    expect(() => sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: '' })).toThrow('Give the new price, for example 99.5.');
    expect(() => sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 'x' })).toThrow('Price must be a number');
    expect(() => sallaProducts.buildProductPriceRequest({ sku: 'TS-1', price: 5, salePrice: -1 })).toThrow('Sale price cannot be negative.');
  });
});

describe('buildUpdateVariantBody', () => {
  it('sends only the given fields, keeping mpn and gtin as strings', () => {
    expect(
      sallaProducts.buildUpdateVariantBody({ sku: ' TS-RED-M ', mpn: '0012', gtin: '00012345', price: '120', stockQuantity: '0', notifyLow: 3 }),
    ).toEqual({ sku: 'TS-RED-M', mpn: '0012', gtin: '00012345', price: 120, stock_quantity: 0, notify_low: 3 });
    expect(sallaProducts.buildUpdateVariantBody({ barcode: '6281000000', salePrice: 90.5, costPrice: '50', weight: '1' })).toEqual({
      barcode: '6281000000',
      sale_price: 90.5,
      cost_price: 50,
      weight: 1,
    });
  });

  it('throws when nothing is set to change', () => {
    expect(() => sallaProducts.buildUpdateVariantBody({})).toThrow('Nothing to update. Fill at least one field to change on the variant.');
    expect(() => sallaProducts.buildUpdateVariantBody({ sku: ' ', price: '', branchQuantities: [] })).toThrow('Nothing to update');
  });

  it('omits stock_quantity when branch quantities are given', () => {
    const body = sallaProducts.buildUpdateVariantBody({
      stockQuantity: 50,
      branchQuantities: [
        { branchId: '7', quantity: '10', reasonId: '3' },
        { branchId: 8, quantity: 0, reasonId: '' },
      ],
    });
    expect(body).toEqual({
      quantities: [
        { branch: 7, quantity: 10, reason_id: 3 },
        { branch: 8, quantity: 0 },
      ],
    });
  });

  it('validates numbers and branch lines', () => {
    expect(() => sallaProducts.buildUpdateVariantBody({ stockQuantity: '2.5' })).toThrow('Stock quantity must be a whole number');
    expect(() => sallaProducts.buildUpdateVariantBody({ notifyLow: -1 })).toThrow('Low stock alert threshold cannot be negative.');
    expect(() => sallaProducts.buildUpdateVariantBody({ branchQuantities: [{ branchId: '7', quantity: '' }] })).toThrow(
      'Branch quantity 1: give the quantity, a whole number such as 10.',
    );
    expect(() => sallaProducts.buildUpdateVariantBody({ branchQuantities: [{ branchId: 'main', quantity: 1 }] })).toThrow(
      'Branch quantity 1: Branch ID must be a numeric Salla ID',
    );
  });
});

describe('buildProductImageForm', () => {
  it('sends a URL as original, with main, sort and alt', () => {
    const form = sallaProducts.buildProductImageForm({ source: { type: 'url', url: ' https://cdn.example.com/a.jpg ' }, main: true, sort: '2', alt: ' Front ' });
    expect(form.get('original')).toBe('https://cdn.example.com/a.jpg');
    expect(form.has('photo')).toBe(false);
    expect(form.get('main')).toBe('1');
    expect(form.get('sort')).toBe('2');
    expect(form.get('alt')).toBe('Front');
  });

  it('sends main as 0 when false and leaves out unset extras', () => {
    const notMain = sallaProducts.buildProductImageForm({ source: { type: 'url', url: 'https://cdn.example.com/a.jpg' }, main: false, alt: ' ' });
    expect(notMain.get('main')).toBe('0');
    expect(notMain.has('sort')).toBe(false);
    expect(notMain.has('alt')).toBe(false);
    const bare = sallaProducts.buildProductImageForm({ source: { type: 'url', url: 'https://cdn.example.com/a.jpg' } });
    expect([...bare.keys()]).toEqual(['original']);
  });

  it('sends a file as a photo Blob with its name and MIME type', async () => {
    const data = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
    const form = sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: 'shirt.png', data, extension: 'png' } }, sort: 1 });
    const photo = fileOf(form.get('photo'));
    expect(photo).toBeInstanceOf(Blob);
    expect(photo.name).toBe('shirt.png');
    expect(photo.type).toBe('image/png');
    expect(Buffer.from(await photo.arrayBuffer())).toEqual(data);
    expect(form.has('original')).toBe(false);
    expect(form.get('sort')).toBe('1');
  });

  it('guesses the MIME type from the file name and names an unnamed file', () => {
    const fromName = fileOf(
      sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: 'PHOTO.JPEG', data: Buffer.from([1]) } } }).get('photo'),
    );
    expect(fromName.type).toBe('image/jpeg');
    const unnamed = fileOf(
      sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: ' ', data: Buffer.from([1]), extension: 'webp' } } }).get('photo'),
    );
    expect(unnamed.name).toBe('image.webp');
    expect(unnamed.type).toBe('image/webp');
    const unknown = fileOf(
      sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: 'scan.tiff', data: Buffer.from([1]) } } }).get('photo'),
    );
    expect(unknown.type).toBe('application/octet-stream');
  });

  it('rejects a bad URL, an empty file, an oversized file and a fractional sort', () => {
    expect(() => sallaProducts.buildProductImageForm({ source: { type: 'url', url: 'cdn.example.com/a.jpg' } })).toThrow(
      '"cdn.example.com/a.jpg" is not an image URL',
    );
    expect(() => sallaProducts.buildProductImageForm({ source: { type: 'url', url: '' } })).toThrow('is not an image URL');
    expect(() => sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: 'a.png', data: Buffer.alloc(0) } } })).toThrow(
      'The image file is empty.',
    );
    expect(() =>
      sallaProducts.buildProductImageForm({ source: { type: 'file', file: { filename: 'a.png', data: Buffer.alloc(10 * 1024 * 1024 + 1) } } }),
    ).toThrow('The image is larger than 10 MB.');
    expect(() => sallaProducts.buildProductImageForm({ source: { type: 'url', url: 'https://x.io/a.jpg' }, sort: 1.5 })).toThrow(
      'Sort order must be a whole number',
    );
  });
});

describe('buildProductListQuery', () => {
  it('trims the keyword, checks the status and makes the category numeric', () => {
    expect(sallaProducts.buildProductListQuery({ maxResults: 10, keyword: ' shirt ', status: 'sale', categoryId: '٣٤' })).toEqual({
      keyword: 'shirt',
      status: 'sale',
      category: '34',
    });
    expect(sallaProducts.buildProductListQuery({ maxResults: 10, keyword: ' ', categoryId: '' })).toEqual({
      keyword: undefined,
      status: undefined,
      category: undefined,
    });
    const archived: string = 'archived';
    expect(() => sallaProducts.buildProductListQuery({ maxResults: 10, status: raw<ProductStatus>(archived) })).toThrow('is not a product status');
    expect(() => sallaProducts.buildProductListQuery({ maxResults: 10, categoryId: 'shirts' })).toThrow('Category ID must be a numeric');
  });

  it('treats an empty or null status as no filter, like category and the create/update builders', () => {
    const empty: string = '';
    const blank: string = ' ';
    const missing: unknown = null;
    expect(sallaProducts.buildProductListQuery({ maxResults: 10, status: raw<ProductStatus>(empty) })['status']).toBeUndefined();
    expect(sallaProducts.buildProductListQuery({ maxResults: 10, status: raw<ProductStatus>(blank) })['status']).toBeUndefined();
    expect(sallaProducts.buildProductListQuery({ maxResults: 10, status: raw<ProductStatus>(missing) })['status']).toBeUndefined();
  });
});

describe('agent path sends empty arrays on update actions', () => {
  it('does not send images or categories when the agent passes []', () => {
    const input: UpdateProductInput & { imageUrls: string[] } = { name: 'Shirt', imageUrls: [], categoryIds: [] };
    const body = sallaProducts.buildUpdateProductBody(input);
    expect(body).toEqual({ name: 'Shirt' });
    expect(body).not.toHaveProperty('images');
  });

  it('does not send branch quantities when the agent passes [] and keeps the stock quantity', () => {
    const body = sallaProducts.buildUpdateVariantBody({ stockQuantity: 4, branchQuantities: [] });
    expect(body).toEqual({ stock_quantity: 4 });
  });
});
