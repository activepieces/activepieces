import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const updateProductAction = createAction({
  displayName: 'Update Form Product',
  name: 'update_product',
  description: 'Update existing product\'s price, description, or availability',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    productSku: Property.ShortText({
      displayName: 'Product SKU',
      description: 'The SKU of the product to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name',
      required: false,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Product quantity',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price',
      required: false,
    }),
    minimum: Property.Number({
      displayName: 'Minimum',
      description: 'Minimum number of products to be selected',
      required: false,
    }),
    maximum: Property.Number({
      displayName: 'Maximum',
      description: 'Maximum number of products to be selected',
      required: false,
    }),
    discountable: Property.Checkbox({
      displayName: 'Discountable',
      description: 'Whether the product can be discounted',
      required: false,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/forms/${propsValue.formSlugOrId}/products/${propsValue.productSku}`;
    
    // Build request body with only provided values
    const body: any = {};
    
    if (propsValue.name) {
      body.name = propsValue.name;
    }
    
    if (propsValue.quantity !== undefined) {
      body.quantity = propsValue.quantity;
    }
    
    if (propsValue.price !== undefined) {
      body.price = propsValue.price;
    }
    
    if (propsValue.minimum !== undefined) {
      body.minimum = propsValue.minimum;
    }
    
    if (propsValue.maximum !== undefined) {
      body.maximum = propsValue.maximum;
    }
    
    if (propsValue.discountable !== undefined) {
      body.discountable = propsValue.discountable;
    }
    
    const response = await paperformCommon.makeRequest(
      paperformAuth, 
      endpoint, 
      HttpMethod.PUT,
      body
    );
    
    return {
      success: true,
      message: 'Product updated successfully',
      product: response.body,
      formSlugOrId: propsValue.formSlugOrId,
      productSku: propsValue.productSku,
    };
  },
}); 