import {
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import {
  ShopifyAuth,
  ShopifyCheckout,
  ShopifyCollect,
  ShopifyCustomer,
  ShopifyDraftOrder,
  ShopifyFulfillment,
  ShopifyFulfillmentEvent,
  ShopifyImage,
  ShopifyOrder,
  ShopifyProduct,
  ShopifyProductVariant,
  ShopifyTransaction,
} from './types';

export function getBaseUrl(shopName: string) {
  return `https://${shopName}.myshopify.com/admin/api/2023-10`;
}

export function sendShopifyRequest(data: {
  url: string;
  method: HttpMethod;
  body?: HttpMessageBody;
  queryParams?: QueryParams;
  auth: ShopifyAuth;
}): Promise<HttpResponse<HttpMessageBody>> {
  return httpClient.sendRequest({
    url: `${getBaseUrl(data.auth.shopName)}${data.url}`,
    method: data.method,
    body: data.body,
    queryParams: data.queryParams,
    headers: {
      'X-Shopify-Access-Token': data.auth.adminToken,
    },
  });
}

export async function createCustomer(
  customer: Partial<ShopifyCustomer>,
  auth: ShopifyAuth
): Promise<ShopifyCustomer> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: '/customers.json',
    method: HttpMethod.POST,
    body: {
      customer,
    },
  });

  return (response.body as { customer: ShopifyCustomer }).customer;
}

export async function getCustomer(
  id: string,
  auth: ShopifyAuth
): Promise<ShopifyCustomer> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/customers/${id}.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { customer: ShopifyCustomer }).customer;
}

export async function getCustomers(
  auth: ShopifyAuth,
): Promise<ShopifyCustomer[]> {
  const queryParams: QueryParams = {};

  let customers:ShopifyCustomer[] = [];
  let hasNextPage = true;

  while (hasNextPage) {

    const response = await sendShopifyRequest({
      auth: auth,
      url: `/customers.json`,
      method: HttpMethod.GET,
      queryParams,
    });

    customers = customers.concat((response.body as { customers: ShopifyCustomer[] }).customers);

    const linkHeader = response.headers?.['link'];
    if (linkHeader && typeof linkHeader === 'string' && linkHeader.includes('rel="next"')) {
      // Extract the URL for the next page from the Link header
      const nextLink = linkHeader
        .split(',')
        .find((s) => s.includes('rel="next"'))
        ?.match(/<(.*?)>/)?.[1];
      
      if (nextLink) {
        queryParams.page_info = new URL(nextLink).searchParams.get('page_info') || '';
      } else {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }
  }

  return customers;

}

export async function updateCustomer(
  id: string,
  customer: Partial<ShopifyCustomer>,
  auth: ShopifyAuth
): Promise<ShopifyCustomer> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/customers/${id}.json`,
    method: HttpMethod.PUT,
    body: {
      customer,
    },
  });

  return (response.body as { customer: ShopifyCustomer }).customer;
}

export async function getCustomerOrders(
  id: string,
  auth: ShopifyAuth
): Promise<ShopifyOrder[]> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/customers/${id}/orders.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { orders: ShopifyOrder[] }).orders;
}

export async function getProducts(
  auth: ShopifyAuth,
  search: {
    title?: string;
    createdAtMin?: string;
    updatedAtMin?: string;
  }
): Promise<ShopifyProduct[]> {
  const queryParams: QueryParams = {};
  const { title, createdAtMin, updatedAtMin } = search;
  if (title) {
    queryParams.title = title;
  }
  if (createdAtMin) {
    queryParams.created_at_min = createdAtMin;
  }
  if (updatedAtMin) {
    queryParams.updated_at_min = updatedAtMin;
  }

  let products:ShopifyProduct[] = [];
  let hasNextPage = true;

  while (hasNextPage) {

    const response = await sendShopifyRequest({
      auth: auth,
      url: `/products.json`,
      method: HttpMethod.GET,
      queryParams,
    });

    products = products.concat((response.body as { products: ShopifyProduct[] }).products);

    const linkHeader = response.headers?.['link'];
    if (linkHeader && typeof linkHeader === 'string' && linkHeader.includes('rel="next"')) {
      // Extract the URL for the next page from the Link header
      const nextLink = linkHeader
        .split(',')
        .find((s) => s.includes('rel="next"'))
        ?.match(/<(.*?)>/)?.[1];
      
      if (nextLink) {
        queryParams.page_info = new URL(nextLink).searchParams.get('page_info') || '';
      } else {
        hasNextPage = false;
      }
    } else {
      hasNextPage = false;
    }
  }

  return products;
}

export async function createProduct(
  product: Partial<ShopifyProduct>,
  auth: ShopifyAuth
): Promise<ShopifyProduct> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/products.json`,
    method: HttpMethod.POST,
    body: {
      product,
    },
  });

  return (response.body as { product: ShopifyProduct }).product;
}

export async function updateProduct(
  id: number,
  product: Partial<ShopifyProduct>,
  auth: ShopifyAuth
): Promise<ShopifyProduct> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/products/${id}.json`,
    method: HttpMethod.PUT,
    body: {
      product,
    },
  });

  return (response.body as { product: ShopifyProduct }).product;
}

export async function createDraftOrder(
  draftOrder: Partial<ShopifyDraftOrder>,
  auth: ShopifyAuth
): Promise<ShopifyDraftOrder> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/draft_orders.json`,
    method: HttpMethod.POST,
    body: {
      draft_order: draftOrder,
    },
  });

  return (response.body as { draft_order: ShopifyDraftOrder }).draft_order;
}

export async function createOrder(
  order: Partial<ShopifyOrder>,
  auth: ShopifyAuth
): Promise<ShopifyOrder> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders.json`,
    method: HttpMethod.POST,
    body: {
      order,
    },
  });

  return (response.body as { order: ShopifyOrder }).order;
}

export async function updateOrder(
  id: number,
  order: Partial<ShopifyOrder>,
  auth: ShopifyAuth
): Promise<ShopifyOrder> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${id}.json`,
    method: HttpMethod.PUT,
    body: {
      order,
    },
  });

  return (response.body as { order: ShopifyOrder }).order;
}

export async function createTransaction(
  orderId: number,
  transaction: Partial<ShopifyTransaction>,
  auth: ShopifyAuth
): Promise<ShopifyTransaction> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/transactions.json`,
    method: HttpMethod.POST,
    body: {
      transaction,
    },
  });

  return (response.body as { transaction: ShopifyTransaction }).transaction;
}

export async function getTransaction(
  id: number,
  orderId: number,
  auth: ShopifyAuth
): Promise<ShopifyTransaction> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/transactions/${id}.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { transaction: ShopifyTransaction }).transaction;
}

export async function getTransactions(
  orderId: number,
  auth: ShopifyAuth
): Promise<ShopifyTransaction[]> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/transactions.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { transactions: ShopifyTransaction[] }).transactions;
}

export async function getFulfillments(
  orderId: number,
  auth: ShopifyAuth
): Promise<ShopifyFulfillment[]> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/fulfillments.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { fulfillments: ShopifyFulfillment[] }).fulfillments;
}

export async function getFulfillment(
  id: number,
  orderId: number,
  auth: ShopifyAuth
): Promise<ShopifyFulfillment> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/fulfillments/${id}.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { fulfillment: ShopifyFulfillment }).fulfillment;
}

export async function getLocations(auth: ShopifyAuth): Promise<unknown[]> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/locations.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { locations: unknown[] }).locations;
}

export async function createFulfillmentEvent(
  id: number,
  orderId: number,
  event: Partial<ShopifyFulfillmentEvent>,
  auth: ShopifyAuth
): Promise<ShopifyFulfillmentEvent> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${orderId}/fulfillments/${id}/events.json`,
    method: HttpMethod.POST,
    body: {
      event,
    },
  });

  return (response.body as { fulfillment_event: ShopifyFulfillmentEvent })
    .fulfillment_event;
}

export async function closeOrder(
  id: number,
  auth: ShopifyAuth
): Promise<ShopifyOrder> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${id}/close.json`,
    method: HttpMethod.POST,
    body: {},
  });

  return (response.body as { order: ShopifyOrder }).order;
}

export async function cancelOrder(
  id: number,
  auth: ShopifyAuth
): Promise<ShopifyOrder> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/orders/${id}/cancel.json`,
    method: HttpMethod.POST,
    body: {},
  });

  return (response.body as { order: ShopifyOrder }).order;
}

export async function adjustInventoryLevel(
  id: number,
  locationId: number,
  adjustment: number,
  auth: ShopifyAuth
): Promise<unknown> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/inventory_levels/adjust.json`,
    method: HttpMethod.POST,
    body: {
      inventory_item_id: id,
      location_id: locationId,
      available_adjustment: adjustment,
    },
  });

  return (response.body as { order: unknown }).order;
}

export async function createCollect(
  collect: Partial<ShopifyCollect>,
  auth: ShopifyAuth
): Promise<ShopifyCollect> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/collects.json`,
    method: HttpMethod.POST,
    body: {
      collect,
    },
  });

  return (response.body as { collect: ShopifyCollect }).collect;
}

export async function getAsset(
  key: string,
  themeId: number,
  auth: ShopifyAuth
): Promise<unknown> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/themes/${themeId}/assets.json`,
    queryParams: {
      key,
    },
    method: HttpMethod.GET,
  });

  return (response.body as { asset: unknown }).asset;
}

export async function getProductVariant(
  id: number,
  auth: ShopifyAuth
): Promise<ShopifyProductVariant> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/variants/${id}.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { variant: ShopifyProductVariant }).variant;
}

export async function getProduct(
  id: number,
  auth: ShopifyAuth
): Promise<ShopifyProduct> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/products/${id}.json`,
    method: HttpMethod.GET,
  });

  return (response.body as { product: ShopifyProduct }).product;
}

export async function createProductImage(
  id: number,
  image: Partial<ShopifyImage>,
  auth: ShopifyAuth
): Promise<ShopifyImage> {
  const response = await sendShopifyRequest({
    auth: auth,
    url: `/products/${id}/images.json`,
    method: HttpMethod.POST,
    body: {
      image,
    },
  });

  return (response.body as { image: ShopifyImage }).image;
}

export async function getAbandonedCheckouts(
  auth: ShopifyAuth,
  search: {
    sinceId: string;
  }
): Promise<ShopifyCheckout[]> {
  const queryParams: QueryParams = {};
  const { sinceId } = search;
  if (sinceId) {
    queryParams.since_id = sinceId;
  }

  const response = await sendShopifyRequest({
    auth: auth,
    url: `/checkouts.json`,
    method: HttpMethod.GET,
    queryParams,
  });

  return (response.body as { checkouts: ShopifyCheckout[] }).checkouts;
}
