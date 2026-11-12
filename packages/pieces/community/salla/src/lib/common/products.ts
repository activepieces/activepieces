import { HttpMethod } from '@activepieces/pieces-common';
import { SallaAuth, SallaQuery, sallaApi } from './client';
import { sallaUtils } from './helpers';

async function listProducts({ auth, filters }: { auth: SallaAuth; filters: ProductFilters }): Promise<ProductListResult> {
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/products',
    query: buildProductListQuery(filters),
    maxItems: filters.maxResults,
    perPage: PRODUCTS_PER_PAGE,
  });
  const products = items.filter(sallaApi.isRecord).map(withProductExtras);
  return { products, count: products.length, truncated };
}

function buildProductListQuery(filters: ProductFilters): SallaQuery {
  const status = filters.status !== undefined && filters.status !== null && String(filters.status).trim() !== '' ? requireProductStatus(filters.status) : undefined;
  return {
    keyword: trimmed(filters.keyword),
    status,
    category:
      filters.categoryId !== undefined && filters.categoryId !== null && String(filters.categoryId).trim() !== ''
        ? sallaUtils.requireId({ value: filters.categoryId, label: 'Category ID' })
        : undefined,
  };
}

async function getProduct({ auth, by, value }: { auth: SallaAuth; by: ProductLookup; value: unknown }): Promise<Record<string, unknown>> {
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.GET,
    path: productPath({ by, value }),
  });
  return withProductExtras(response.body.data);
}

function productPath({ by, value }: { by: ProductLookup; value: unknown }): string {
  if (by === 'sku') {
    return `/products/sku/${encodeURIComponent(requireSku({ value }))}`;
  }
  return `/products/${sallaUtils.requireId({ value, label: 'Product ID' })}`;
}

async function createProduct({ auth, input }: { auth: SallaAuth; input: CreateProductInput }): Promise<Record<string, unknown>> {
  const body = buildCreateProductBody(input);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/products',
    body,
  });
  const product = withProductExtras(response.body.data);
  const requestedStatus = PRODUCT_STATUSES.find((status) => status === body['status']);
  if (requestedStatus === undefined || product['status'] === requestedStatus) {
    return product;
  }
  try {
    await changeProductStatus({ auth, productId: product['id'], status: requestedStatus });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The product was created with ID ${String(product['id'] ?? 'unknown')}, but Salla did not set its status to "${requestedStatus}". ${reason}`,
    );
  }
  return { ...product, status: requestedStatus };
}

function buildCreateProductBody(input: CreateProductInput): Record<string, unknown> {
  const name = trimmed(input.name);
  if (!name) {
    throw new Error('Give the product a name.');
  }
  if (!PRODUCT_TYPES.includes(input.productType)) {
    throw new Error(`"${String(input.productType)}" is not a Salla product type. Use one of: ${PRODUCT_TYPES.join(', ')}.`);
  }
  const price = nonNegative({ value: input.price, label: 'Price' });
  if (price === undefined) {
    throw new Error('Give the product a price, for example 99.5.');
  }
  const images = buildImageList(input.imageUrls);
  return sallaUtils.compact({
    name,
    product_type: input.productType,
    price,
    ...buildSharedProductFields(input),
    images: images.length > 0 ? images : undefined,
  });
}

async function updateProduct({
  auth,
  by,
  value,
  input,
}: {
  auth: SallaAuth;
  by: ProductLookup;
  value: unknown;
  input: UpdateProductInput;
}): Promise<Record<string, unknown>> {
  const path = productPath({ by, value });
  const body = buildUpdateProductBody(input);
  const current = await sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path });
  const channelsBefore = channelsOf(current.body.data);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path,
    body,
    omitLanguage: true,
  });
  const product = withProductExtras(response.body.data);
  const channelsAfter = channelsOf(product);
  if (channelsBefore === undefined || (channelsAfter !== undefined && sameChannels({ first: channelsBefore, second: channelsAfter }))) {
    return product;
  }
  try {
    await setSalesChannels({ auth, productId: product['id'], channels: channelsBefore });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The product was updated, but Salla changed its sales channels to ${(channelsAfter ?? []).join(', ') || 'none'} and putting back ${channelsBefore.join(', ')} failed. ${reason}`,
    );
  }
  return { ...product, channels: channelsBefore, show_in_app: channelsBefore.includes('app') };
}

function channelsOf(product: unknown): string[] | undefined {
  if (!sallaApi.isRecord(product) || !Array.isArray(product['channels'])) {
    return undefined;
  }
  return product['channels'].filter((channel): channel is string => typeof channel === 'string');
}

function sameChannels({ first, second }: { first: string[]; second: string[] }): boolean {
  return first.length === second.length && first.every((channel) => second.includes(channel));
}

async function setSalesChannels({ auth, productId, channels }: { auth: SallaAuth; productId: unknown; channels: string[] }): Promise<void> {
  const id = Number(sallaUtils.requireId({ value: productId, label: 'Product ID' }));
  await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/products/actions',
    body: {
      operations: [{ action_name: 'sale-channels', value: { channels } }],
      filters: { select_all: false, unselected_ids: [], ids: [id] },
    },
  });
}

function buildUpdateProductBody(input: UpdateProductInput): Record<string, unknown> {
  const body = sallaUtils.compact({
    name: trimmed(input.name),
    price: nonNegative({ value: input.price, label: 'Price' }),
    ...buildSharedProductFields(input),
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Nothing to update. Fill at least one field to change on the product.');
  }
  return body;
}

function buildSharedProductFields(input: SharedProductInput): Record<string, unknown> {
  const unlimitedQuantity = sallaUtils.triState(input.unlimitedQuantity);
  const weightType = input.weightType !== undefined && input.weightType !== null && String(input.weightType).trim() !== '' ? input.weightType : undefined;
  if (weightType !== undefined && !WEIGHT_TYPES.includes(weightType)) {
    throw new Error(`"${String(weightType)}" is not a weight unit. Use one of: ${WEIGHT_TYPES.join(', ')}.`);
  }
  const categoryIds = sallaUtils.toStringList(input.categoryIds).map((id) => Number(sallaUtils.requireId({ value: id, label: 'Category ID' })));
  return {
    status: input.status !== undefined && input.status !== null && String(input.status).trim() !== '' ? requireProductStatus(input.status) : undefined,
    description: trimmed(input.description),
    sale_price: nonNegative({ value: input.salePrice, label: 'Sale price' }),
    sale_start: sallaUtils.toStoreDate(input.saleStart),
    sale_end: sallaUtils.toStoreDate(input.saleEnd),
    cost_price: nonNegative({ value: input.costPrice, label: 'Cost price' }),
    quantity: unlimitedQuantity === true ? undefined : wholeNumber({ value: input.quantity, label: 'Quantity' }),
    unlimited_quantity: unlimitedQuantity,
    sku: trimmed(input.sku),
    mpn: trimmed(input.mpn),
    gtin: trimmed(input.gtin),
    weight: nonNegative({ value: input.weight, label: 'Weight' }),
    weight_type: weightType,
    require_shipping: sallaUtils.triState(input.requireShipping),
    categories: categoryIds.length > 0 ? categoryIds : undefined,
    brand_id:
      input.brandId !== undefined && input.brandId !== null && String(input.brandId).trim() !== ''
        ? Number(sallaUtils.requireId({ value: input.brandId, label: 'Brand ID' }))
        : undefined,
    maximum_quantity_per_order: wholeNumber({ value: input.maximumQuantityPerOrder, label: 'Maximum quantity per order' }),
    hide_quantity: sallaUtils.triState(input.hideQuantity),
    enable_upload_image: sallaUtils.triState(input.enableUploadImage),
    enable_note: sallaUtils.triState(input.enableNote),
    subtitle: trimmed(input.subtitle),
    promotion_title: trimmed(input.promotionTitle),
    promotion_subtitle: trimmed(input.promotionSubtitle),
    metadata_title: trimmed(input.metadataTitle),
    metadata_description: trimmed(input.metadataDescription),
    metadata_url: trimmed(input.metadataUrl),
    calories: trimmed(input.calories === undefined || input.calories === null ? undefined : String(input.calories)),
  };
}

function buildImageList(imageUrls: unknown): Record<string, unknown>[] {
  const urls = sallaUtils.toStringList(imageUrls);
  if (urls.length > MAX_PRODUCT_IMAGES) {
    throw new Error(`Salla allows at most ${MAX_PRODUCT_IMAGES} images per product; you gave ${urls.length}.`);
  }
  return urls.map((url, index) => {
    if (!/^https?:\/\//i.test(url)) {
      throw new Error(`"${url}" is not an image URL. Use a full public link that starts with https://.`);
    }
    return index === 0 ? { original: url, default: true, sort: 1 } : { original: url, sort: index + 1 };
  });
}

async function deleteProduct({ auth, productId }: { auth: SallaAuth; productId: unknown }): Promise<ProductDeleteResult> {
  const id = sallaUtils.requireId({ value: productId, label: 'Product ID' });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.DELETE,
    path: `/products/${id}`,
  });
  return { product_id: Number(id), deleted: true, message: messageOf(response.body.data) };
}

async function changeProductStatus({
  auth,
  productId,
  status,
}: {
  auth: SallaAuth;
  productId: unknown;
  status: ProductStatus;
}): Promise<ProductStatusResult> {
  const id = sallaUtils.requireId({ value: productId, label: 'Product ID' });
  const target = requireProductStatus(status);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/products/${id}/status`,
    body: { status: target },
  });
  return { product_id: Number(id), status: target, message: messageOf(response.body.data) };
}

async function adjustStock({ auth, input }: { auth: SallaAuth; input: StockAdjustmentInput }): Promise<StockAdjustmentResult> {
  const body = buildStockBody(input);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: '/products/quantities/bulk',
    body,
  });
  const lines = body.products.map((line) => ({
    identifier_type: line.identifer_type,
    identifier: line.identifer,
    quantity: line.quantity,
    mode: line.mode,
    branch_id: line.branch ?? null,
    reason_id: line.reason_id ?? null,
    unlimited_quantity: line.unlimited_quantity ?? null,
  }));
  return {
    queued: true,
    message: messageOf(response.body.data),
    line_count: lines.length,
    lines,
  };
}

function buildStockBody(input: StockAdjustmentInput): { products: StockLineBody[] } {
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new Error('Add at least one stock line: the product or variant to change and the quantity.');
  }
  return { products: input.lines.map((line, index) => buildStockLine({ line, index })) };
}

function buildStockLine({ line, index }: { line: StockLineInput; index: number }): StockLineBody {
  const position = `Stock line ${index + 1}`;
  if (!STOCK_IDENTIFIER_TYPES.includes(line.identifierType)) {
    throw new Error(`${position}: "${String(line.identifierType)}" is not a valid identifier type. Use id, variant_id or sku.`);
  }
  if (!STOCK_MODES.includes(line.mode)) {
    throw new Error(`${position}: "${String(line.mode)}" is not a valid mode. Use increment, decrement or overwrite.`);
  }
  const identifier =
    line.identifierType === 'sku'
      ? requireSku({ value: line.identifier, position })
      : sallaUtils.requireId({ value: line.identifier, label: line.identifierType === 'id' ? `${position}: Product ID` : `${position}: Variant ID` });
  const quantity = wholeNumber({ value: line.quantity, label: `${position}: Quantity` });
  if (quantity === undefined) {
    throw new Error(`${position}: give the quantity, a whole number such as 5.`);
  }
  if (line.mode !== 'overwrite' && quantity === 0) {
    throw new Error(`${position}: quantity must be greater than 0 when adding or removing stock.`);
  }
  const branch =
    line.branchId !== undefined && line.branchId !== null && String(line.branchId).trim() !== ''
      ? Number(sallaUtils.requireId({ value: line.branchId, label: `${position}: Branch ID` }))
      : undefined;
  const reasonId =
    line.reasonId !== undefined && line.reasonId !== null && String(line.reasonId).trim() !== ''
      ? Number(sallaUtils.requireId({ value: line.reasonId, label: `${position}: Reason ID` }))
      : undefined;
  const unlimitedQuantity = sallaUtils.triState(line.unlimitedQuantity);
  const result: StockLineBody = { identifer_type: line.identifierType, identifer: identifier, quantity, mode: line.mode };
  if (branch !== undefined) {
    result.branch = branch;
  }
  if (reasonId !== undefined) {
    result.reason_id = reasonId;
  }
  if (unlimitedQuantity !== undefined) {
    result.unlimited_quantity = unlimitedQuantity;
  }
  return result;
}

async function listStockChangeReasons({ auth }: { auth: SallaAuth }): Promise<StockReasonListResult> {
  const response = await sallaApi.request<unknown[]>({
    auth,
    method: HttpMethod.GET,
    path: '/products/quantities/quantity-change-reason',
  });
  const data = Array.isArray(response.body.data) ? response.body.data : [];
  const reasons = data.filter(sallaApi.isRecord);
  return { reasons, count: reasons.length, truncated: false };
}

async function updateProductPrice({ auth, input }: { auth: SallaAuth; input: ProductPriceInput }): Promise<Record<string, unknown>> {
  const request = buildProductPriceRequest(input);
  const response = await sallaApi.request<unknown>({
    auth,
    method: request.method,
    path: request.path,
    body: request.body,
  });
  return withProductExtras(response.body.data);
}

function buildProductPriceRequest(input: ProductPriceInput): { method: HttpMethod; path: string; body: Record<string, unknown> } {
  const sku = encodeURIComponent(requireSku({ value: input.sku }));
  const price = nonNegative({ value: input.price, label: 'Price' });
  if (price === undefined) {
    throw new Error('Give the new price, for example 99.5.');
  }
  const extras = sallaUtils.compact({
    sale_price: nonNegative({ value: input.salePrice, label: 'Sale price' }),
    cost_price: nonNegative({ value: input.costPrice, label: 'Cost price' }),
    sale_end: sallaUtils.toStoreDate(input.saleEnd),
  });
  if (Object.keys(extras).length === 0) {
    return { method: HttpMethod.POST, path: `/products/sku/${sku}/price`, body: { price } };
  }
  return { method: HttpMethod.PUT, path: `/products/sku/${sku}`, body: { price, ...extras } };
}

async function listVariants({ auth, productId }: { auth: SallaAuth; productId: unknown }): Promise<VariantListResult> {
  const id = sallaUtils.requireId({ value: productId, label: 'Product ID' });
  const [productResponse, paged] = await Promise.all([
    sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: `/products/${id}` }),
    sallaApi.fetchPaged<unknown>({ auth, path: `/products/${id}/variants`, maxItems: MAX_VARIANTS, perPage: 60 }),
  ]);
  const optionNames = optionValueNames(productResponse.body.data);
  const variants = paged.items.filter(sallaApi.isRecord).map((variant) => withVariantExtras({ variant, optionNames, productId: Number(id) }));
  return { variants, count: variants.length, truncated: paged.truncated };
}

function optionValueNames(product: unknown): Map<string, string> {
  const names = new Map<string, string>();
  if (!sallaApi.isRecord(product) || !Array.isArray(product['options'])) {
    return names;
  }
  for (const option of product['options']) {
    if (!sallaApi.isRecord(option) || !Array.isArray(option['values'])) {
      continue;
    }
    for (const value of option['values']) {
      if (!sallaApi.isRecord(value)) {
        continue;
      }
      const valueId = idText(value['id']);
      const valueName = textOrUndefined(value['name']);
      if (valueId && valueName) {
        names.set(valueId, valueName);
      }
    }
  }
  return names;
}

function withVariantExtras({
  variant,
  optionNames,
  productId,
}: {
  variant: unknown;
  optionNames?: Map<string, string>;
  productId?: number;
}): Record<string, unknown> {
  if (!sallaApi.isRecord(variant)) {
    return {};
  }
  const valueIds = Array.isArray(variant['related_option_values'])
    ? variant['related_option_values'].map(idText).filter((id): id is string => id !== undefined)
    : [];
  const valueNames = valueIds.map((valueId) => optionNames?.get(valueId)).filter((name): name is string => name !== undefined);
  const sku = textOrUndefined(variant['sku']);
  const id = idText(variant['id']);
  const nameLabel = valueNames.length > 0 ? valueNames.join(' / ') : `Variant ${id ?? ''}`.trim();
  const flat: Record<string, unknown> = {
    label: sku ? `${nameLabel} · ${sku}` : nameLabel,
    option_values: valueNames.join(' / ') || null,
    product_id: productId ?? null,
    price_amount: sallaUtils.amountOf(variant['price']) ?? null,
    sale_price_amount: sallaUtils.amountOf(variant['sale_price']) ?? null,
    regular_price_amount: sallaUtils.amountOf(variant['regular_price']) ?? null,
    cost_price_amount: sallaUtils.amountOf(variant['cost_price']) ?? null,
    currency: currencyOf(variant['price']) ?? currencyOf(variant['sale_price']),
    stock_quantity_number: sallaUtils.amountOf(variant['stock_quantity']) ?? null,
    updated_at_iso: sallaUtils.toIsoDate(variant['updated_at']) ?? null,
  };
  return { ...flat, ...variant, ...numbersFromText({ record: variant, keys: VARIANT_NUMBER_FIELDS }) };
}

async function updateVariant({
  auth,
  variantId,
  productId,
  input,
}: {
  auth: SallaAuth;
  variantId: unknown;
  productId?: unknown;
  input: UpdateVariantInput;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: variantId, label: 'Variant ID' });
  const ownerId =
    productId !== undefined && productId !== null && String(productId).trim() !== ''
      ? Number(sallaUtils.requireId({ value: productId, label: 'Product ID' }))
      : undefined;
  const body = buildUpdateVariantBody(input);
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.PUT,
    path: `/products/variants/${encodeURIComponent(id)}`,
    body,
  });
  const variant = response.body.data;
  const ownerProductId = ownerId ?? (sallaApi.isRecord(variant) ? idText(variant['product_id']) : undefined);
  const optionNames = ownerProductId === undefined ? undefined : await readOptionNames({ auth, productId: ownerProductId });
  return withVariantExtras({ variant, optionNames, productId: ownerProductId === undefined ? undefined : Number(ownerProductId) });
}

async function readOptionNames({ auth, productId }: { auth: SallaAuth; productId: string | number }): Promise<Map<string, string> | undefined> {
  try {
    const response = await sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: `/products/${productId}` });
    return optionValueNames(response.body.data);
  } catch {
    return undefined;
  }
}

function buildUpdateVariantBody(input: UpdateVariantInput): Record<string, unknown> {
  const quantities = (input.branchQuantities ?? []).map((entry, index) => {
    const label = `Branch quantity ${index + 1}`;
    const quantity = wholeNumber({ value: entry.quantity, label: `${label}: Quantity` });
    if (quantity === undefined) {
      throw new Error(`${label}: give the quantity, a whole number such as 10.`);
    }
    return sallaUtils.compact({
      branch: Number(sallaUtils.requireId({ value: entry.branchId, label: `${label}: Branch ID` })),
      quantity,
      reason_id:
        entry.reasonId !== undefined && entry.reasonId !== null && String(entry.reasonId).trim() !== ''
          ? Number(sallaUtils.requireId({ value: entry.reasonId, label: `${label}: Reason ID` }))
          : undefined,
    });
  });
  const body = sallaUtils.compact({
    sku: trimmed(input.sku),
    barcode: trimmed(input.barcode),
    price: nonNegative({ value: input.price, label: 'Price' }),
    sale_price: nonNegative({ value: input.salePrice, label: 'Sale price' }),
    cost_price: nonNegative({ value: input.costPrice, label: 'Cost price' }),
    stock_quantity: quantities.length > 0 ? undefined : wholeNumber({ value: input.stockQuantity, label: 'Stock quantity' }),
    weight: nonNegative({ value: input.weight, label: 'Weight' }),
    mpn: trimmed(input.mpn),
    gtin: trimmed(input.gtin),
    notify_low: wholeNumber({ value: input.notifyLow, label: 'Low stock alert threshold' }),
    quantities: quantities.length > 0 ? quantities : undefined,
  });
  if (Object.keys(body).length === 0) {
    throw new Error('Nothing to update. Fill at least one field to change on the variant.');
  }
  return body;
}

async function addProductImage({
  auth,
  productId,
  source,
  main,
  sort,
  alt,
}: {
  auth: SallaAuth;
  productId: unknown;
  source: ProductImageSource;
  main?: boolean;
  sort?: string | number;
  alt?: string;
}): Promise<Record<string, unknown>> {
  const id = sallaUtils.requireId({ value: productId, label: 'Product ID' });
  const form = buildProductImageForm({ source, main, sort, alt });
  const response = await sallaApi.request<unknown>({
    auth,
    method: HttpMethod.POST,
    path: `/products/${id}/images`,
    body: form,
    timeout: IMAGE_UPLOAD_TIMEOUT_MS,
  });
  return withImageExtras({ image: response.body.data, productId: Number(id) });
}

function buildProductImageForm({
  source,
  main,
  sort,
  alt,
}: {
  source: ProductImageSource;
  main?: boolean;
  sort?: string | number;
  alt?: string;
}): FormData {
  const form = new FormData();
  if (source.type === 'url') {
    const url = trimmed(source.url);
    if (!url || !/^https?:\/\//i.test(url)) {
      throw new Error(`"${source.url ?? ''}" is not an image URL. Use a full public link that starts with https://.`);
    }
    form.append('original', url);
  } else {
    const file = source.file;
    if (!file || !file.data || file.data.length === 0) {
      throw new Error('The image file is empty. Pick an image file to upload.');
    }
    if (file.data.length > MAX_IMAGE_BYTES) {
      throw new Error('The image is larger than 10 MB. Use a smaller image.');
    }
    const filename = trimmed(file.filename) ?? `image.${file.extension ?? 'jpg'}`;
    const blob = new Blob([new Uint8Array(file.data)], { type: imageMimeType({ filename, extension: file.extension }) });
    form.append('photo', blob, filename);
  }
  if (main !== undefined) {
    form.append('main', main ? '1' : '0');
  }
  const sortNumber = wholeNumber({ value: sort, label: 'Sort order' });
  if (sortNumber !== undefined) {
    form.append('sort', String(sortNumber));
  }
  const altText = trimmed(alt);
  if (altText) {
    form.append('alt', altText);
  }
  return form;
}

function imageMimeType({ filename, extension }: { filename: string; extension?: string }): string {
  const ext = (extension ?? filename.split('.').pop() ?? '').toLowerCase().replace(/^\./, '');
  return IMAGE_MIME_TYPES[ext] ?? 'application/octet-stream';
}

function withImageExtras({ image, productId }: { image: unknown; productId: number }): Record<string, unknown> {
  if (!sallaApi.isRecord(image)) {
    return { product_id: productId };
  }
  const nested = sallaApi.isRecord(image['image']) ? image['image'] : {};
  const original = sallaApi.isRecord(nested['original']) ? nested['original'] : {};
  const thumbnail = sallaApi.isRecord(nested['thumbnail']) ? nested['thumbnail'] : {};
  const flat: Record<string, unknown> = {
    product_id: productId,
    url: textOrUndefined(original['url']) ?? textOrUndefined(image['url']) ?? null,
    thumbnail_url: textOrUndefined(thumbnail['url']) ?? null,
  };
  return { ...flat, ...image };
}

async function listCategories({
  auth,
  keyword,
  maxResults = MAX_CATEGORIES,
}: {
  auth: SallaAuth;
  keyword?: string;
  maxResults?: number;
}): Promise<CategoryListResult> {
  const search = trimmed(keyword);
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/categories',
    query: search ? { keyword: search } : undefined,
    maxItems: maxResults,
    perPage: 60,
  });
  const categories = flattenCategories(items);
  return { categories, count: categories.length, truncated };
}

function flattenCategories(tree: unknown[]): FlatCategory[] {
  const result: FlatCategory[] = [];
  const seen = new Set<string>();
  const visit = ({ node, parentId, parentPath, depth }: { node: unknown; parentId: number | null; parentPath: string[]; depth: number }) => {
    if (!sallaApi.isRecord(node) || depth > MAX_CATEGORY_DEPTH) {
      return;
    }
    const id = idText(node['id']);
    if (!id) {
      return;
    }
    const name = textOrUndefined(node['name']) ?? id;
    const path = [...parentPath, name];
    const ownParent = idText(node['parent_id']);
    const resolvedParent = ownParent && ownParent !== '0' ? Number(ownParent) : parentId;
    if (!seen.has(id)) {
      seen.add(id);
      const urls = sallaApi.isRecord(node['urls']) ? node['urls'] : {};
      result.push({
        id: Number(id),
        name,
        path: path.join(' > '),
        parent_id: resolvedParent,
        depth,
        status: textOrUndefined(node['status']) ?? null,
        sort_order: typeof node['sort_order'] === 'number' ? node['sort_order'] : null,
        image: textOrUndefined(node['image']) ?? null,
        url: textOrUndefined(urls['customer']) ?? null,
      });
    }
    const children = Array.isArray(node['sub_categories']) ? node['sub_categories'] : node['items'];
    if (Array.isArray(children)) {
      for (const child of children) {
        visit({ node: child, parentId: Number(id), parentPath: path, depth: depth + 1 });
      }
    }
  };
  for (const node of tree) {
    visit({ node, parentId: null, parentPath: [], depth: 0 });
  }
  return result;
}

async function listBrands({
  auth,
  keyword,
  maxResults = MAX_BRANDS,
}: {
  auth: SallaAuth;
  keyword?: string;
  maxResults?: number;
}): Promise<BrandListResult> {
  const search = trimmed(keyword);
  const { items, truncated } = await sallaApi.fetchPaged<unknown>({
    auth,
    path: '/brands',
    query: search ? { keyword: search } : undefined,
    maxItems: maxResults,
    perPage: 60,
  });
  const brands = items.filter(sallaApi.isRecord);
  return { brands, count: brands.length, truncated };
}

function withProductExtras(product: unknown): Record<string, unknown> {
  if (!sallaApi.isRecord(product)) {
    return {};
  }
  const urls = sallaApi.isRecord(product['urls']) ? product['urls'] : {};
  const brand = sallaApi.isRecord(product['brand']) ? product['brand'] : undefined;
  const categories = Array.isArray(product['categories']) ? product['categories'].filter(sallaApi.isRecord) : [];
  const categoryNames = categories.map((category) => textOrUndefined(category['name'])).filter((name): name is string => name !== undefined);
  const flat: Record<string, unknown> = {
    price_amount: sallaUtils.amountOf(product['price']) ?? null,
    sale_price_amount: positiveOrNull(sallaUtils.amountOf(product['sale_price'])),
    regular_price_amount: sallaUtils.amountOf(product['regular_price']) ?? null,
    taxed_price_amount: sallaUtils.amountOf(product['taxed_price']) ?? null,
    cost_price_amount: sallaUtils.amountOf(product['cost_price'] ?? product['cost']) ?? null,
    currency: currencyOf(product['price']) ?? currencyOf(product['sale_price']) ?? textOrUndefined(product['currency']) ?? null,
    sale_end_date: dateText(product['sale_end']) ?? dateText(sallaApi.isRecord(product['sale_price']) ? product['sale_price']['expired_at'] : undefined) ?? null,
    main_image_url: imageUrlOf(product['main_image']) ?? imageUrlOf(product['thumbnail']) ?? firstImageUrl(product['images']) ?? null,
    customer_url: textOrUndefined(urls['customer']) ?? textOrUndefined(product['url']) ?? null,
    admin_url: textOrUndefined(urls['admin']) ?? null,
    brand_id: brand ? brand['id'] ?? null : null,
    brand_name: brand ? textOrUndefined(brand['name']) ?? null : null,
    category_ids: categories.map((category) => category['id']).filter((id) => typeof id === 'number' || typeof id === 'string'),
    category_names: categoryNames.length > 0 ? categoryNames.join(', ') : null,
    updated_at_iso: sallaUtils.toIsoDate(product['updated_at']) ?? null,
  };
  const numbers = numbersFromText({ record: product, keys: PRODUCT_NUMBER_FIELDS });
  if (Array.isArray(product['skus'])) {
    numbers['skus'] = product['skus'].map((sku) =>
      sallaApi.isRecord(sku) ? { ...sku, ...numbersFromText({ record: sku, keys: SKU_NUMBER_FIELDS }) } : sku,
    );
  }
  return { ...flat, ...product, ...numbers };
}

function numbersFromText({ record, keys }: { record: Record<string, unknown>; keys: readonly string[] }): Record<string, unknown> {
  const numbers: Record<string, unknown> = {};
  for (const key of keys) {
    const value = record[key];
    if (typeof value !== 'string') {
      continue;
    }
    const parsed = sallaUtils.amountOf(value);
    if (parsed !== undefined) {
      numbers[key] = parsed;
    }
  }
  return numbers;
}

function positiveOrNull(value: number | undefined): number | null {
  return value !== undefined && value > 0 ? value : null;
}

function currencyOf(value: unknown): string | undefined {
  return sallaApi.isRecord(value) ? textOrUndefined(value['currency']) : undefined;
}

function dateText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (sallaApi.isRecord(value) && typeof value['date'] === 'string') {
    return value['date'];
  }
  return undefined;
}

function imageUrlOf(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return textOrUndefined(value);
  }
  if (sallaApi.isRecord(value)) {
    return textOrUndefined(value['url']);
  }
  return undefined;
}

function firstImageUrl(images: unknown): string | undefined {
  if (!Array.isArray(images)) {
    return undefined;
  }
  const records = images.filter(sallaApi.isRecord);
  const main = records.find((image) => image['main'] === true) ?? records[0];
  return main ? imageUrlOf(main) : undefined;
}

function messageOf(data: unknown): string | undefined {
  return sallaApi.isRecord(data) && typeof data['message'] === 'string' ? data['message'] : undefined;
}

function requireProductStatus(value: unknown): ProductStatus {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const match = PRODUCT_STATUSES.find((status) => status === text);
  if (!match) {
    throw new Error(`"${String(value ?? '')}" is not a product status. Use sale (on sale), out (out of stock) or hidden.`);
  }
  return match;
}

function requireSku({ value, position }: { value: unknown; position?: string }): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (text.length === 0) {
    throw new Error(`${position ? `${position}: give` : 'Give'} the product SKU, for example TSHIRT-RED-M.`);
  }
  return text;
}

function nonNegative({ value, label }: { value: unknown; label: string }): number | undefined {
  const parsed = sallaUtils.optionalNumber({ value, label });
  if (parsed !== undefined && parsed < 0) {
    throw new Error(`${label} cannot be negative.`);
  }
  return parsed;
}

function wholeNumber({ value, label }: { value: unknown; label: string }): number | undefined {
  const parsed = nonNegative({ value, label });
  if (parsed !== undefined && !Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number, but got "${String(value)}".`);
  }
  return parsed;
}

function idText(value: unknown): string | undefined {
  return typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0) ? String(value).trim() : undefined;
}

function textOrUndefined(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

function trimmed(value: string | undefined | null): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const result = value.trim();
  return result.length > 0 ? result : undefined;
}

const PRODUCTS_PER_PAGE = 60;
const PRODUCT_NUMBER_FIELDS = ['quantity', 'notify_quantity', 'sold_quantity', 'maximum_quantity_per_order', 'views', 'weight'] as const;
const SKU_NUMBER_FIELDS = ['stock_quantity'] as const;
const VARIANT_NUMBER_FIELDS = ['notify_low', 'weight'] as const;
const MAX_VARIANTS = 500;
const MAX_CATEGORIES = 500;
const MAX_BRANDS = 500;
const MAX_CATEGORY_DEPTH = 10;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PRODUCT_IMAGES = 10;
const IMAGE_UPLOAD_TIMEOUT_MS = 60000;

const PRODUCT_TYPES: ProductType[] = ['product', 'service', 'group_products', 'codes', 'digital', 'food', 'booking', 'donating'];
const PRODUCT_STATUSES: ProductStatus[] = ['sale', 'out', 'hidden'];
const WEIGHT_TYPES: WeightType[] = ['kg', 'g', 'lb', 'oz'];
const STOCK_IDENTIFIER_TYPES: StockIdentifierType[] = ['id', 'variant_id', 'sku'];
const STOCK_MODES: StockMode[] = ['increment', 'decrement', 'overwrite'];

const IMAGE_MIME_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
};

export const sallaProducts = {
  listProducts,
  buildProductListQuery,
  getProduct,
  createProduct,
  buildCreateProductBody,
  updateProduct,
  buildUpdateProductBody,
  deleteProduct,
  changeProductStatus,
  adjustStock,
  buildStockBody,
  listStockChangeReasons,
  updateProductPrice,
  buildProductPriceRequest,
  listVariants,
  updateVariant,
  buildUpdateVariantBody,
  addProductImage,
  buildProductImageForm,
  listCategories,
  flattenCategories,
  listBrands,
  withProductExtras,
  withVariantExtras,
  withImageExtras,
};

export { PRODUCT_TYPES, PRODUCT_STATUSES, WEIGHT_TYPES, STOCK_IDENTIFIER_TYPES, STOCK_MODES };

type ProductStatus = 'sale' | 'out' | 'hidden';

type ProductType = 'product' | 'service' | 'group_products' | 'codes' | 'digital' | 'food' | 'booking' | 'donating';

type WeightType = 'kg' | 'g' | 'lb' | 'oz';

type ProductLookup = 'id' | 'sku';

type TriStateInput = 'unchanged' | 'yes' | 'no' | boolean | null | undefined;

type StockIdentifierType = 'id' | 'variant_id' | 'sku';

type StockMode = 'increment' | 'decrement' | 'overwrite';

type ProductFilters = {
  maxResults: number;
  keyword?: string;
  status?: ProductStatus;
  categoryId?: string | number;
};

type ProductListResult = {
  products: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type SharedProductInput = {
  status?: ProductStatus;
  description?: string;
  salePrice?: string | number;
  saleStart?: string;
  saleEnd?: string;
  costPrice?: string | number;
  quantity?: string | number;
  unlimitedQuantity?: TriStateInput;
  sku?: string;
  mpn?: string;
  gtin?: string;
  weight?: string | number;
  weightType?: WeightType;
  requireShipping?: TriStateInput;
  categoryIds?: Array<string | number> | string;
  brandId?: string | number;
  maximumQuantityPerOrder?: string | number;
  hideQuantity?: TriStateInput;
  enableUploadImage?: TriStateInput;
  enableNote?: TriStateInput;
  subtitle?: string;
  promotionTitle?: string;
  promotionSubtitle?: string;
  metadataTitle?: string;
  metadataDescription?: string;
  metadataUrl?: string;
  calories?: string | number;
};

type CreateProductInput = SharedProductInput & {
  name: string;
  productType: ProductType;
  price: string | number;
  imageUrls?: string[] | string;
};

type UpdateProductInput = SharedProductInput & {
  name?: string;
  price?: string | number;
};

type ProductDeleteResult = {
  product_id: number;
  deleted: true;
  message?: string;
};

type ProductStatusResult = {
  product_id: number;
  status: ProductStatus;
  message?: string;
};

type StockLineInput = {
  identifierType: StockIdentifierType;
  identifier: string | number;
  quantity: string | number;
  mode: StockMode;
  branchId?: string | number;
  reasonId?: string | number;
  unlimitedQuantity?: TriStateInput;
};

type StockAdjustmentInput = {
  lines: StockLineInput[];
};

type StockLineBody = {
  identifer_type: StockIdentifierType;
  identifer: string;
  quantity: number;
  mode: StockMode;
  branch?: number;
  reason_id?: number;
  unlimited_quantity?: boolean;
};

type StockAdjustmentResult = {
  queued: true;
  message?: string;
  line_count: number;
  lines: Array<{
    identifier_type: StockIdentifierType;
    identifier: string;
    quantity: number;
    mode: StockMode;
    branch_id: number | null;
    reason_id: number | null;
    unlimited_quantity: boolean | null;
  }>;
};

type StockReasonListResult = {
  reasons: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type ProductPriceInput = {
  sku: string;
  price: string | number;
  salePrice?: string | number;
  costPrice?: string | number;
  saleEnd?: string;
};

type VariantListResult = {
  variants: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

type BranchQuantityInput = {
  branchId: string | number;
  quantity: string | number;
  reasonId?: string | number;
};

type UpdateVariantInput = {
  sku?: string;
  barcode?: string;
  price?: string | number;
  salePrice?: string | number;
  costPrice?: string | number;
  stockQuantity?: string | number;
  weight?: string | number;
  mpn?: string;
  gtin?: string;
  notifyLow?: string | number;
  branchQuantities?: BranchQuantityInput[];
};

type ProductImageFile = {
  filename: string;
  data: Buffer;
  extension?: string;
};

type ProductImageSource = { type: 'url'; url: string } | { type: 'file'; file: ProductImageFile };

type FlatCategory = {
  id: number;
  name: string;
  path: string;
  parent_id: number | null;
  depth: number;
  status: string | null;
  sort_order: number | null;
  image: string | null;
  url: string | null;
};

type CategoryListResult = {
  categories: FlatCategory[];
  count: number;
  truncated: boolean;
};

type BrandListResult = {
  brands: Record<string, unknown>[];
  count: number;
  truncated: boolean;
};

export type {
  ProductStatus,
  ProductType,
  WeightType,
  ProductLookup,
  TriStateInput,
  StockIdentifierType,
  StockMode,
  ProductFilters,
  ProductListResult,
  SharedProductInput,
  CreateProductInput,
  UpdateProductInput,
  ProductDeleteResult,
  ProductStatusResult,
  StockLineInput,
  StockAdjustmentInput,
  StockLineBody,
  StockAdjustmentResult,
  StockReasonListResult,
  ProductPriceInput,
  VariantListResult,
  BranchQuantityInput,
  UpdateVariantInput,
  ProductImageFile,
  ProductImageSource,
  FlatCategory,
  CategoryListResult,
  BrandListResult,
};
