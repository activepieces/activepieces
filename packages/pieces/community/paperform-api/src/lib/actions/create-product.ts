import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { paperformCommon, PaperformAuth } from '../auth';
import { paperformApiAuth } from '@activepieces/piece-paperform-api';

export const createProductAction = createAction({
  displayName: 'Create Form Product',
  name: 'create_product',
  description: 'Add a commerce-style product/item to a form',
  props: {
    formSlugOrId: Property.ShortText({
      displayName: 'Form Slug or ID',
      description: 'The form\'s slug, custom slug or ID',
      required: true,
    }),
    productFieldKey: Property.ShortText({
      displayName: 'Product Field Key',
      description: 'The key of a product field on the form',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Product quantity',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Price',
      description: 'Product price',
      required: true,
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
      defaultValue: false,
    }),
    sku: Property.ShortText({
      displayName: 'SKU',
      description: 'Product SKU',
      required: true,
    }),
  },
  auth: paperformApiAuth,
  async run({ auth, propsValue }) {
    const paperformAuth: PaperformAuth = { auth: auth as string };
    
    const endpoint = `/forms/${propsValue.formSlugOrId}/products`;
    
    // Build request body with required and optional values
    const body: any = {
      product_field_key: propsValue.productFieldKey,
      name: propsValue.name,
      price: propsValue.price,
      sku: propsValue.sku,
    };
    
    if (propsValue.quantity !== undefined) {
      body.quantity = propsValue.quantity;
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
      HttpMethod.POST,
      body
    );
    
    return {
      success: true,
      message: 'Product created successfully',
      product: response.body,
      formSlugOrId: propsValue.formSlugOrId,
    };
  },
}); 