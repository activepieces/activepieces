import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown } from '../common/props';

export const createFormProduct = createAction({
  auth: PaperformAuth,
  name: 'createFormProduct',
  displayName: 'Create Form Product',
  description: 'Create a product for a specific form',
  props: {
    slug_or_id: formSlugOrIdDropdown,
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The price of the product (in the form currency)',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'The quantity of the product',
      required: false,
    }),
    SKU: Property.ShortText({
      displayName: 'SKU',
      description: 'The SKU of the product (must be unique)',
      required: true,
    }),
    product_field_key: Property.ShortText({
      displayName: 'Product Field Key',
      description: 'The product field key identifier',
      required: true,
    }),
    minimum: Property.Number({
      displayName: 'Minimum Quantity',
      description: 'Minimum number of products to be selected.',
      required: false,
      defaultValue: 1,
    }),
    maximum: Property.Number({
      displayName: 'Maximum Quantity',
      description: 'Maximum number of products to be selected.',
      required: false,
      defaultValue: 10,
    }),
    discountable: Property.Checkbox({
      displayName: 'Discountable',
      description: 'Whether the product can be discounted',
      required: false,
      defaultValue: true,
    }),
    images: Property.Array({
      displayName: 'Images',
      description: 'List of product images',
      required: false,
      properties: {
        url: Property.ShortText({
          displayName: 'Image URL',
          description: 'URL of the product image',
          required: true,
        }),
        width: Property.Number({
          displayName: 'Image Width',
          description: 'Width of the product image in pixels',
          required: false,
        }),
        height: Property.Number({
          displayName: 'Image Height',
          description: 'Height of the product image in pixels',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const {
      slug_or_id,
      name,
      price,
      quantity,
      SKU,
      product_field_key,
      minimum,
      maximum,
      discountable,
      images,
    } = context.propsValue;
    const apiKey = context.auth as string;

    const productData: any = {
      name,
      price,
      quantity,
      SKU,
      discountable: discountable ?? true,
    };

    // Add optional fields if provided
    if (product_field_key) {
      productData.product_field_key = product_field_key;
    }

    if (minimum !== undefined) {
      productData.minimum = minimum;
    }

    if (maximum !== undefined) {
      productData.maximum = maximum;
    }

    // Handle images array with proper structure
    if (images && images.length > 0) {
      productData.images = images.map((image: any) => {
        const imageObj: any = {
          url: image.url,
        };

        if (image.width !== undefined) {
          imageObj.width = image.width;
        }

        if (image.height !== undefined) {
          imageObj.height = image.height;
        }

        return imageObj;
      });
    }
    
    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/forms/${slug_or_id}/products`,
      productData
    );

    return {
      success: true,
      message: `Successfully created product "${name}" for form ${slug_or_id}`,
      product: response.results.product,
    };
  },
});
