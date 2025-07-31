import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { PaperformProduct } from '../common/types';

export const deleteFormProduct = createAction({
  auth: paperformAuth,
  name: 'deleteFormProduct',
  displayName: 'Delete Form Product',
  description: 'Remove a product from a form.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to delete a product from',
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
      description: 'Select the product to delete',
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
  },
  async run({ auth, propsValue }) {
    const { formId, productSku } = propsValue;
    
    try {
      await paperformCommon.apiCall({
        method: HttpMethod.DELETE,
        url: `/forms/${formId}/products/${productSku}`,
        auth: auth as string,
      });
      
      return {
        success: true,
        message: `Product "${productSku}" has been successfully deleted.`,
      };
    } catch (error: any) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  },
});
