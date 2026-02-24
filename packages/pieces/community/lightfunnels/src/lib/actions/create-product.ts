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
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'The SKU of the product',
      required: false,
    }),
    options: Property.Array({
      displayName: 'Options',
      description: 'Product options like size, color, etc.',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'Option ID',
          description: 'Unique identifier for the option',
          required: true,
        }),
        label: Property.ShortText({
          displayName: 'Label',
          description: 'The option label (e.g., "Color", "Size")',
          required: false,
        }),
        options: Property.Json({
          displayName: 'Option Values',
          description: 'Available values for this option (e.g., [{"value": "Red"}, {"value": "Blue"}])',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'Type',
          description: 'The type of option',
          required: false,
          options: {
            disabled: false,
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Color', value: 'color' },
              { label: 'Image', value: 'image' },
            ],
          },
        }),
      },
    }),
    variants: Property.Array({
      displayName: 'Variants',
      description: 'Product variants with their details',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'Variant ID',
          description: 'Unique identifier for the variant',
          required: true,
        }),
        sku: Property.ShortText({
          displayName: 'Variant SKU',
          description: 'SKU for this specific variant',
          required: false,
        }),
        price: Property.Number({
          displayName: 'Variant Price',
          description: 'Price for this variant',
          required: false,
        }),
        compare_at_price: Property.Number({
          displayName: 'Variant Compare at Price',
          description: 'Original price for this variant',
          required: false,
        }),
        options: Property.Json({
          displayName: 'Variant Options',
          description: 'Option values for this variant (array of objects with id and value pairs)',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const {
      title,
      price,
      description,
      compare_at_price,
      sku,
      options,
      variants,
    } = context.propsValue;

    const graphqlQuery = `
      mutation mutationName($node: InputProduct!) {
        createProduct(node: $node) {
          id
          _id
          title
          description
          price
          compare_at_price
          sku
          options {
            id
            label
            
            type
          }
          variants {
            id
            sku
            price
            compare_at_price       
          }
          created_at
          updated_at
        }
      }
    `;

    const inputOptions = (options || []).map((opt: any) => {
      const optionValues = (opt.options || []).map((o: any) => o.value);
      return {
        id: opt.id,
        label: opt.label || undefined,
        options: optionValues,
        type: opt.type || 'text',
      };
    });

    const inputVariants = (variants || []).map((variant: any) => ({
      id: variant.id,
      sku: variant.sku || undefined,
      price: variant.price !== undefined ? variant.price : price,
      compare_at_price: variant.compare_at_price || compare_at_price,
      options: (variant.options || []).map((opt: any) => ({
        id: opt.id,
        value: opt.value,
      })),
    }));

    const variables = {
      node: {
        title,
        price,
        description: description || undefined,
        compare_at_price: compare_at_price || undefined,
        sku: sku || undefined,
        options: inputOptions,
        variants: inputVariants,
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
