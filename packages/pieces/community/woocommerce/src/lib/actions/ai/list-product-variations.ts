import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wooAuth } from '../../auth';
import { wooClient } from '../../common/client';
import { wooProps, wooValues } from '../../common/props';
import { listProductVariationsOutputSchema } from '../../output-schemas';

export const wooAiListProductVariations = createAction({
  name: 'list_product_variations',
  classification: 'SEARCH',
  displayName: 'List Product Variations',
  description: 'List the variations of a variable product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the variations (such as sizes or colours) of one variable product, with their ids, attributes, prices and stock. Use it to find a variation id for get_product_variation or update_product_variation; simple products have no variations. Paged: if a page returns exactly per_page items, request the next page.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: listProductVariationsOutputSchema,
  props: {
    product_id: Property.Number({
      displayName: 'Product ID',
      description: 'Id of the variable product. Find it with list_products.',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Only return the variation with this SKU.',
      required: false,
    }),
    stock_status: wooProps.stockStatusProp({
      description: 'Only return variations with this stock status.',
    }),
    page: wooProps.pageProp(),
    per_page: wooProps.perPageProp(),
  },
  async run(context) {
    const props = context.propsValue;
    const paging = await wooValues.paging({ page: props.page, perPage: props.per_page });
    return wooClient.request<unknown[]>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/products/${wooClient.encodeId(props.product_id)}/variations`,
      queryParams: {
        sku: wooValues.nonEmpty(props.sku),
        stock_status: props.stock_status,
        ...paging,
      },
    });
  },
});
