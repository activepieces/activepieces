import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findFormProduct = createAction({
  auth: paperformAuth,
  name: 'findFormProduct',
  displayName: 'Find Form Product',
  description: 'Retrieve product metadata from a form by product ID or name.',
  props: {
    formId: Property.Dropdown({
      displayName: 'Form',
      description: 'Select the form to search products in',
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
    search: Property.ShortText({
      displayName: 'Search Products',
      description: 'Search products by name (optional)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { formId, search } = propsValue;
    
    try {
      const response = await paperformCommon.getProducts({
        formSlugOrId: formId as string,
        auth: auth as string,
        search: search as string,
        limit: 100,
      });
      
      return {
        success: true,
        message: `Found ${response.results.products.length} product(s)${search ? ` matching "${search}"` : ''}.`,
        products: response.results.products,
        total: response.total,
        has_more: response.has_more,
      };
    } catch (error: any) {
      throw new Error(`Failed to find products: ${error.message}`);
    }
  },
});
