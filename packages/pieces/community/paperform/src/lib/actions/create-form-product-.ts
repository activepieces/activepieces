import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformCreateProductResponse, PaperformField } from '../common/types';
import { paperformCommonProps } from '../common/props';
import { isNil } from '@activepieces/shared';

export const createFormProduct = createAction({
  auth: paperformAuth,
  name: 'createFormProduct',
  displayName: 'Create Form Product',
  description: 'Creates a form product.',
  props: {
    formId:paperformCommonProps.formId,
    productFieldKey: paperformCommonProps.productFieldKey,
    name: Property.ShortText({
      displayName: 'Product Name',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'Product SKU',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Product Price',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Product quantity',
      required: false,
    }),
    minimum: Property.Number({
      displayName: 'Minimum Quantity',
      required: false,
    }),
    maximum: Property.Number({
      displayName: 'Maximum Quantity',
      required: false,
    }),
    discountable: Property.Checkbox({
      displayName: 'Discountable ?',
      required: false,
      defaultValue: false,
    }),
    imageUrl: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the product image',
      required: false,
    }),
    imageWidth: Property.Number({
      displayName: 'Image Width',
      description: 'Width of the product image in pixels',
      required: false,
    }),
    imageHeight: Property.Number({
      displayName: 'Image Height',
      description: 'Height of the product image in pixels (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      formId, 
      productFieldKey, 
      name, 
      sku, 
      price, 
      quantity, 
      minimum, 
      maximum, 
      discountable, 
      imageUrl,
      imageWidth,
      imageHeight
    } = propsValue;
    
    if (!price || price < 0) {
      throw new Error('Product price is required and must be ≥ 0');
    }
    
    if (quantity !== undefined && quantity < 0) {
      throw new Error('Quantity must be ≥ 0');
    }
    
    if (minimum !== undefined && minimum < 0) {
      throw new Error('Minimum quantity must be ≥ 0');
    }
    
    if (maximum !== undefined && maximum < 0) {
      throw new Error('Maximum quantity must be ≥ 0');
    }
    
    if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
      throw new Error('Minimum quantity cannot be greater than maximum quantity');
    }

    if(imageUrl && isNil(imageWidth))
    {
      throw new Error('Provide Image Width.');

    }
    
    const requestBody: any = {
      product_field_key: productFieldKey,
      name,
      price,
      SKU: sku,
    };
    
    if (quantity !== undefined) {
      requestBody.quantity = quantity;
    }
    
    if (minimum !== undefined) {
      requestBody.minimum = minimum;
    }
    
    if (maximum !== undefined) {
      requestBody.maximum = maximum;
    }
    
    if (discountable !== undefined) {
      requestBody.discountable = discountable;
    }
    
    if (imageUrl && imageWidth) {
      const image: any = {
        url: imageUrl,
        width: imageWidth,
      };
      
      if (imageHeight) {
        image.height = imageHeight;
      }
      
      requestBody.images = [image];
    }
    
    try {
      const response = await paperformCommon.apiCall<PaperformCreateProductResponse>({
        method: HttpMethod.POST,
        url: `/forms/${formId}/products`,
        body: requestBody,
        auth: auth as string,
      });
      
      return response.results.product;
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  },
});
