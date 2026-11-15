import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listProductsOutputSchema } from '../../output-schemas';

export const wooAiListProducts = createAction({
  name: 'list_products',
  classification: 'SEARCH',
  displayName: 'List Products',
  description: 'List products, filtered by text, SKU, status, category, tag, stock or price.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the store catalog and returns matching products, including their ids, prices and stock. Use it to find a product id by name or SKU before get_product, update_product or create_order; variations of a variable product are listed with list_product_variations. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listProductsOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Text to match against product names and content.',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Exact SKU to match. Separate several SKUs with commas.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Only return products with this status. Leave empty for any status.',
      required: false,
      options: { options: wooProps.productStatusOptions },
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Only return products of this type.',
      required: false,
      options: { options: wooProps.productTypeOptions },
    }),
    category_id: Property.Number({
      displayName: 'Category ID',
      description: 'Only return products in this category. Find ids with list_product_categories.',
      required: false,
    }),
    tag_id: Property.Number({
      displayName: 'Tag ID',
      description: 'Only return products with this tag. Find ids with list_product_tags.',
      required: false,
    }),
    stock_status: wooProps.stockStatusProp({
      description: 'Only return products with this stock status.',
    }),
    on_sale: wooProps.triStateProp({
      displayName: 'On Sale',
      description: 'Yes returns only products on sale, No only products not on sale. Leave empty for both.',
    }),
    min_price: Property.ShortText({
      displayName: 'Minimum Price',
      description: 'Only return products priced at or above this amount, e.g. 10.00.',
      required: false,
    }),
    max_price: Property.ShortText({
      displayName: 'Maximum Price',
      description: 'Only return products priced at or below this amount, e.g. 99.99.',
      required: false,
    }),
    orderby: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to date.',
      required: false,
      options: {
        options: [
          { label: 'Date', value: 'date' },
          { label: 'ID', value: 'id' },
          { label: 'Title', value: 'title' },
          { label: 'Slug', value: 'slug' },
          { label: 'Price', value: 'price' },
          { label: 'Popularity', value: 'popularity' },
          { label: 'Rating', value: 'rating' },
        ],
      },
    }),
    order: wooProps.sortOrderProp(),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    const onSale = wooValues.resolveTriState(props.on_sale);
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/products',
      queryParams: {
        search: wooValues.nonEmpty(props.search),
        sku: wooValues.nonEmpty(props.sku),
        status: props.status,
        type: props.type,
        category: props.category_id,
        tag: props.tag_id,
        stock_status: props.stock_status,
        on_sale: onSale,
        min_price: wooValues.nonEmpty(props.min_price),
        max_price: wooValues.nonEmpty(props.max_price),
        orderby: props.orderby,
        order: props.order,
        ...paging,
      },
    });
  },
});
