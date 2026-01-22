import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const getProduct = createAction({
  auth: lightfunnelsAuth,
  name: 'get_product',
  displayName: 'Get Product',
  description: 'Retrieve a specific product by ID',
  props: {
    productId: Property.ShortText({
      displayName: 'Product ID',
      description: 'The ID of the product to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { productId } = context.propsValue;

    const graphqlQuery = `
      query productQuery($id: ID!) {
        product: node(id: $id) {
          __typename
          ... on Product {
            __typename
            id
            _id
            uid
            slug
            title
            description
            notice_text
            updated_at
            price
            sku
            file_id
            compare_at_price
            product_type
            shipping_group_id
            price_bundle_id
            thumbnail {
              id
              path
            }
            file {
              id
              title
              size
              path
            }
            options {
              id
              label
              options
              type
              options_types {
                option_id
                value
              }
            }
            tags {
              id
              title
            }
            images_ids
            variants {
              id
              price
              file_id
              image_id
              compare_at_price
              sku
              options {
                option_id: id
                value
              }
              enable_inventory_limit
              inventory_quantity
            }
            order_bump {
              id
              title
              price
              sku
              enabled
              compare_at_price
              description
              image_id
              file_id
            }
            order_bumps {
              id
              order_bump_product_id
              variant_id
              is_checked
              product {
                id
                uid
                title
                description
                price
                compare_at_price
                sku
                file_id
              }
            }
            features {
              id
              title
              description
              image_id
            }
            testimonials {
              id
              name
              position
              comment
              image_id
            }
            faq {
              id
              question
              answer
            }
            enable_custom_options
            custom_options {
              id
              type
              name
              placeholder
            }
            price_bundle {
              id
              items {
                id
                label
                quantity
                discount_value
                discount_type
              }
            }
            default_variant {
              id
              uid: id
              file_uid: file_id
              _id
              price
              image {
                id
                path
              }
              compare_at_price
              sku
            }
            inventory_quantity
            enable_inventory_limit
            funnels {
              id
              uid: id
              name
              slug
            }
            stores {
              id
              uid: id
              name
              slug
            }
            created_at
          }
        }
      }
    `;

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      { id: productId },
    );

    return response.data.product;
  },
})
