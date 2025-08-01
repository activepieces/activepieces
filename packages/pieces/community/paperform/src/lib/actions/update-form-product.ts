import { createAction, Property } from '@activepieces/pieces-framework';
import { PaperformAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { formSlugOrIdDropdown, productSKUDropdown } from '../common/props';

export const updateFormProduct = createAction({
  auth: PaperformAuth,
  name: 'updateFormProduct',
  displayName: 'Update Form Product',
  description: "Update existing product's price, description, or availability",
  props: {
    slug_or_id: formSlugOrIdDropdown,
    product_sku: productSKUDropdown,
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'The price of the product (in the form currency)',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'The quantity of the product',
      required: false,
    }),

    minimum: Property.Number({
      displayName: 'Minimum Quantity',
      description: 'Minimum number of products to be selected.',
      required: false,
    }),
    maximum: Property.Number({
      displayName: 'Maximum Quantity',
      description: 'Maximum number of products to be selected.',
      required: false,
    }),
    discountable: Property.Checkbox({
      displayName: 'Discountable',
      description: 'Whether the product can be discounted',
      required: false,
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
      product_sku,
      name,
      price,
      quantity,

      minimum,
      maximum,
      discountable,
      images,
    } = context.propsValue;
    const apiKey = context.auth as string;

    const productData: any = {};

    // Only include fields that have values (partial update)
    if (name !== undefined) {
      productData.name = name;
    }

    if (price !== undefined) {
      productData.price = price;
    }

    if (quantity !== undefined) {
      productData.quantity = quantity;
    }

    if (minimum !== undefined) {
      productData.minimum = minimum;
    }

    if (maximum !== undefined) {
      productData.maximum = maximum;
    }

    if (discountable !== undefined) {
      productData.discountable = discountable;
    }

    // Handle images array with proper structure
    if (images !== undefined) {
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
      } else {
        productData.images = [];
      }
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.PUT,
      `/forms/${slug_or_id}/products/${product_sku}`,
      productData
    );

    return {
      success: true,
      message: `Successfully updated product ${product_sku} for form ${slug_or_id}`,
      product: response.results.product,
    };
  },
});
