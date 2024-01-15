import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { wooCommon } from '../common';
import { wooAuth } from '../..';

export const product = createTrigger({
  name: 'product',
  displayName: 'Product',
  description: 'Triggers when any product is created, updated or deleted.',
  type: TriggerStrategy.WEBHOOK,
  auth: wooAuth,
  props: {},
  //Create the webhooks in WooCommerce and save the webhook IDs in store for disable behavior
  async onEnable(context) {
    const webhookIds = await wooCommon.subscribeWebhook(
      context.webhookUrl,
      'Product',
      context.auth
    );

    await context.store?.put('_product_trigger', {
      webhookIds: webhookIds,
    });
  },
  //Delete the webhooks from WooCommerce
  async onDisable(context) {
    const response = (await context.store?.get('_product_trigger')) as {
      webhookIds: number[];
    };
    if (response !== null && response !== undefined) {
      response.webhookIds.forEach((webhookId: number) => {
        wooCommon.unsubscribeWebhook(webhookId, context.auth);
      });
    }
  },
  //Return product data
  async run(context) {
    return [context.payload.body];
  },

  sampleData: {
    id: 20,
    sku: '',
    name: 'My Product',
    slug: 'my-product',
    tags: [],
    type: 'simple',
    price: '5',
    _links: {
      self: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/products/20',
        },
      ],
      collection: [
        {
          href: 'https://myshop.com/index.php?rest_route=/wc/v3/products',
        },
      ],
    },
    images: [],
    description: '<p>Description <strong>bold</strong></p>\n<p>New Line</p>\n',
    date_created: '2023-07-06T14:51:45',
    date_modified: '2023-07-06T14:51:45',
    total_sales: 0,
    stock_status: 'instock',
    rating_count: 0,
    status: 'publish',
    weight: '',
    on_sale: false,
    virtual: false,
    featured: false,
    downloads: [],
    meta_data: [],
    parent_id: 0,
    permalink: 'https://myshop.com/?product=my-product',
    tax_class: '',
    attributes: [],
    backorders: 'no',
    categories: [
      {
        id: 15,
        name: 'Uncategorized',
        slug: 'uncategorized',
      },
    ],
    dimensions: {
      width: '',
      height: '',
      length: '',
    },
    menu_order: 0,
    price_html:
      '<span class="woocommerce-Price-amount amount"><bdi>5,000 <span class="woocommerce-Price-currencySymbol">د.ا</span></bdi></span>',
    sale_price: '',
    tax_status: 'taxable',
    upsell_ids: [],
    variations: [],
    backordered: false,
    button_text: '',
    has_options: false,
    purchasable: true,
    related_ids: [12],
    downloadable: false,
    external_url: '',
    manage_stock: false,
    purchase_note: '',
    regular_price: '5',
    average_rating: '0.00',
    cross_sell_ids: [],
    download_limit: -1,
    shipping_class: '',
    stock_quantity: null,
    date_on_sale_to: null,
    download_expiry: -1,
    reviews_allowed: true,
    date_created_gmt: '2023-07-06T14:51:45',
    grouped_products: [],
    low_stock_amount: null,
    shipping_taxable: true,
    date_modified_gmt: '2023-07-06T14:51:45',
    date_on_sale_from: null,
    shipping_class_id: 0,
    shipping_required: true,
    short_description: '',
    sold_individually: false,
    backorders_allowed: false,
    catalog_visibility: 'visible',
    default_attributes: [],
    date_on_sale_to_gmt: null,
    date_on_sale_from_gmt: null,
  },
});
