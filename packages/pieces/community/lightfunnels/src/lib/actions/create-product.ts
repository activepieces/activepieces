import { createAction, Property } from '@activepieces/pieces-framework';
import { lightfunnelsAuth } from '../../index';
import { lightfunnelsCommon } from '../common/index';

export const createProduct = createAction({
  auth: lightfunnelsAuth,
  name: 'create_product',
  displayName: 'Create Product',
  description: 'Create a new product',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the product',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The price of the product',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the product',
      required: false,
    }),
    compare_at_price: Property.Number({
      displayName: 'Compare at Price',
      description: 'The original price before discount',
      required: false,
    }),
  },
  async run(context) {
    const { title, price, description, compare_at_price } = context.propsValue;

    const graphqlQuery = `
      mutation createProductMutation($node: InputProduct!) {
        createProduct(node: $node) {
          id
          _id
          title
          description
          price
          compare_at_price
          created_at
          updated_at
        }
      }
    `;

    const variables = {
      node: {
        title,
        price,
        description,
        compare_at_price,
        //  Gotta add more fields here later
      },
    };

    const response = await lightfunnelsCommon.makeGraphQLRequest(
      context.auth,
      graphqlQuery,
      variables
    );

    return response.data.createProduct;
  },
});
