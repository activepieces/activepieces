import { createAction, Property } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { sendBigCommerceRequest, BigCommerceAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchProduct = createAction({
  auth: bigCommerceAuth,
  name: 'search_product',
  displayName: 'Search Product',
  description: 'Search for products in the BigCommerce catalog',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Search by product name (partial match supported)',
      required: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Search by SKU (partial match supported)',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Product Type',
      description: 'Filter by product type',
      required: false,
      options: {
        options: [
          { label: 'Physical', value: 'physical' },
          { label: 'Digital', value: 'digital' },
        ],
      },
    }),
    categories: Property.ShortText({
      displayName: 'Category ID',
      description: 'Filter by category ID (exact match)',
      required: false,
    }),
    brand_id: Property.Number({
      displayName: 'Brand ID',
      description: 'Filter by brand ID (exact match)',
      required: false,
    }),
    availability: Property.StaticDropdown({
      displayName: 'Availability',
      description: 'Filter by availability status',
      required: false,
      options: {
        options: [
          { label: 'Available', value: 'available' },
          { label: 'Disabled', value: 'disabled' },
          { label: 'Pre-order', value: 'preorder' },
        ],
      },
    }),
    is_visible: Property.Checkbox({
      displayName: 'Is Visible Only',
      description: 'Filter to show only visible products on storefront',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Search by keyword (searches across name, description, and SKU)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (default: 50, max: 250)',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const {
      name,
      sku,
      type,
      categories,
      brand_id,
      availability,
      is_visible,
      keyword,
      limit,
    } = context.propsValue;

    // Build query parameters
    const queryParams: Record<string, string> = {};

    // Add search filters
    if (name) {
      queryParams['name:like'] = name;
    }
    if (sku) {
      queryParams['sku:like'] = sku;
    }
    if (type) {
      queryParams['type'] = type;
    }
    if (categories) {
      queryParams['categories:in'] = categories;
    }
    if (brand_id !== undefined) {
      queryParams['brand_id'] = brand_id.toString();
    }
    if (availability) {
      queryParams['availability'] = availability;
    }
    if (is_visible !== undefined) {
      queryParams['is_visible'] = is_visible ? 'true' : 'false';
    }
    if (keyword) {
      queryParams['keyword'] = keyword;
    }

    // Add limit
    if (limit) {
      queryParams['limit'] = Math.min(limit, 250).toString();
    }

    // Send request to search products
    const response = await sendBigCommerceRequest<{
      data: Array<{
        id: number;
        name: string;
        type: string;
        sku: string;
        description: string;
        weight: number;
        width: number;
        depth: number;
        height: number;
        price: number;
        cost_price: number;
        retail_price: number;
        sale_price: number;
        map_price: number;
        tax_class_id: number;
        product_tax_code: string;
        calculated_price: number;
        categories: number[];
        brand_id: number;
        inventory_level: number;
        inventory_warning_level: number;
        inventory_tracking: string;
        reviews_rating_sum: number;
        reviews_count: number;
        total_sold: number;
        fixed_cost_shipping_price: number;
        is_free_shipping: boolean;
        is_visible: boolean;
        is_featured: boolean;
        related_products: number[];
        warranty: string;
        bin_picking_number: string;
        layout_file: string;
        upc: string;
        mpn: string;
        gtin: string;
        search_keywords: string;
        availability: string;
        availability_description: string;
        gift_wrapping_options_type: string;
        gift_wrapping_options_list: number[];
        sort_order: number;
        condition: string;
        is_condition_shown: boolean;
        order_quantity_minimum: number;
        order_quantity_maximum: number;
        page_title: string;
        meta_keywords: string[];
        meta_description: string;
        date_created: string;
        date_modified: string;
        view_count: number;
        preorder_release_date: string;
        preorder_message: string;
        is_preorder_only: boolean;
        is_price_hidden: boolean;
        price_hidden_label: string;
        custom_url: {
          url: string;
          is_customized: boolean;
        };
        base_variant_id: number;
        open_graph_type: string;
        open_graph_title: string;
        open_graph_description: string;
        open_graph_use_meta_description: boolean;
        open_graph_use_product_name: boolean;
        open_graph_use_image: boolean;
      }>;
      meta: {
        pagination: {
          total: number;
          count: number;
          per_page: number;
          current_page: number;
          total_pages: number;
          links: {
            previous?: string;
            current: string;
            next?: string;
          };
        };
      };
    }>({
      auth: context.auth as BigCommerceAuth,
      method: HttpMethod.GET,
      url: '/catalog/products',
      queryParams,
    });

    return {
      products: response.body.data,
      total_found: response.body.meta.pagination.total,
      count: response.body.data.length,
      pagination: response.body.meta.pagination,
    };
  },
});
