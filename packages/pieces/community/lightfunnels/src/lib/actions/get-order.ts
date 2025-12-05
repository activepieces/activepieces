import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const getOrder = createAction({
  auth: lightfunnelsAuth,
  name: 'get_order',
  displayName: 'Get Order',
  description: 'Retrieve a specific order by ID',
  props: {
    orderId: Property.ShortText({
      displayName: 'Order ID',
      description: 'The ID of the order to retrieve',
      required: true,
    }),
  },
  async run(context) {
    const { orderId } = context.propsValue;

    const graphqlQuery = `
      query viewOrderQuery($id: ID!) {
        order: node(id: $id) {
          __typename
          ... on Order {
            id
            _id
            total
            subtotal
            discount_value
            normal_discount_value
            bundle_discount_value
            pm_discount_value
            pm_extra_fees
            name
            notes
            email
            phone
            archived_at
            refunded_amount
            paid_by_customer
            net_payment
            original_total
            refundable
            created_at
            cancelled_at
            test
            tags
            shipping
            shipping_discount
            customer {
              id
              full_name
              avatar
              location
            }
            custom
            items {
              __typename
              ... on VariantSnapshot {
                product_id
                id
                _id
                image {
                  path
                  id
                }
                title
                price
                variant_id
                fulfillment_status
                carrier
                tracking_number
                tracking_link
                refund_id
                payment_id
                removed_at
                sku
                custom_options {
                  name
                  key
                  value
                  type
                }
                options {
                  id
                  label
                  value
                }
              }
            }
            payments {
              id
              _id
              total
              sub_total
              created_at
              refunded
              refundable
              price_bundle_snapshot {
                id
                value
                discount_result
                label
              }
              discount_snapshot {
                _id
                id
                type
                code
                value
                discount_result
              }
              refunds {
                id
                _id
                amount
                reason
              }
            }
            shipping_address {
              first_name
              last_name
              email
              phone
              line1
              line2
              country
              city
              area
              zip
              state
            }
            billing_address {
              first_name
              last_name
              email
              phone
              line1
              line2
              country
              city
              area
              zip
              state
            }
            client_details {
              ip
            }
            currency
          }
        }
      }
    `;

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      { id: orderId }
    );

    return response.data.order;
  },
});
