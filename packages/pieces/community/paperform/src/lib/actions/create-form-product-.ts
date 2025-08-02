import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformField } from '../common/types';

export const createFormProduct = createAction({
  auth: paperformAuth,
  name: 'createFormProduct',
  displayName: 'Create Form Product',
  description: 'Add a commerce-style product/item to a form.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to create a product for',
      required: true,
      refreshers: ['auth'],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your account first',
            options: [],
          };
        }
        
        try {
          const forms = await paperformCommon.getForms({
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: forms.results.forms.map((form) => ({
              label: form.title,
              value: form.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading forms',
            options: [],
          };
        }
      },
    }),
    productFieldKey: Property.Dropdown({
      displayName: 'Product Field',
      description: 'Select the product field on the form (required)',
      required: true,
      refreshers: ['auth', 'formId'],
      options: async ({ auth, formId }) => {
        if (!auth || !formId) {
          return {
            disabled: true,
            placeholder: 'Please select a form first',
            options: [],
          };
        }
        
        try {
          const fields = await paperformCommon.getFormFields({
            formSlugOrId: formId as string,
            auth: auth as string,
          });
          
          const productFields = fields.results.fields.filter((field: PaperformField) => field.type === 'products');
          
          if (productFields.length === 0) {
            return {
              disabled: true,
              placeholder: 'No product fields found on this form',
              options: [],
            };
          }
          
          return {
            disabled: false,
            options: productFields.map((field: PaperformField) => ({
              label: `${field.title} (${field.key})`,
              value: field.key,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading form fields',
            options: [],
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name (required)',
      required: true,
    }),
    sku: Property.ShortText({
      displayName: 'Product SKU',
      description: 'Product SKU (required)',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Product Price',
      description: 'Product price (required)',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      description: 'Product quantity',
      required: false,
    }),
    minimum: Property.Number({
      displayName: 'Minimum Quantity',
      description: 'Minimum number of products to be selected',
      required: false,
    }),
    maximum: Property.Number({
      displayName: 'Maximum Quantity',
      description: 'Maximum number of products to be selected',
      required: false,
    }),
    discountable: Property.Checkbox({
      displayName: 'Discountable',
      description: 'Whether the product can be discounted',
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
      const response = await paperformCommon.apiCall({
        method: HttpMethod.POST,
        url: `/forms/${formId}/products`,
        body: requestBody,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Product "${name}" has been successfully created.`,
        product: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  },
});
