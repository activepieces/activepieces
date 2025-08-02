import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformProduct } from '../common/types';

export const updateFormProduct = createAction({
  auth: paperformAuth,
  name: 'updateFormProduct',
  displayName: 'Update Form Product',
  description: 'Update existing product\'s price, description, or availability.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to update a product for',
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
    productSku: Property.Dropdown({
      displayName: 'Product',
      description: 'Select the product to update',
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
          const products = await paperformCommon.getProducts({
            formSlugOrId: formId as string,
            auth: auth as string,
            limit: 100,
          });
          
          return {
            disabled: false,
            options: products.results.products.map((product: PaperformProduct) => ({
              label: `${product.name} (${product.SKU}) - $${product.price}`,
              value: product.SKU,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            placeholder: 'Error loading products',
            options: [],
          };
        }
      },
    }),
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Product name',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Product Price',
      description: 'Product price',
      required: false,
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
      productSku, 
      name, 
      price, 
      quantity, 
      minimum, 
      maximum, 
      discountable, 
      imageUrl,
      imageWidth,
      imageHeight
    } = propsValue;
    
    if (price !== undefined && price < 0) {
      throw new Error('Product price must be ≥ 0');
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
    
    const requestBody: any = {};
    
    if (name !== undefined) {
      requestBody.name = name;
    }
    
    if (price !== undefined) {
      requestBody.price = price;
    }
    
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
    
    // Add image if provided
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
        method: HttpMethod.PUT,
        url: `/forms/${formId}/products/${productSku}`,
        body: requestBody,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Product "${productSku}" has been successfully updated.`,
        product: response,
      };
    } catch (error: any) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  },
});
