import { createAction, Property } from '@activepieces/pieces-framework';
import { paperformAuth } from '../common/auth';
import { paperformCommon } from '../common/client';

export const findFormProduct = createAction({
  auth: paperformAuth,
  name: 'findFormProduct',
  displayName: 'Find Form Product',
  description: 'Finds a form product by name.',
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
      displayName: 'Form Product Name',
      required: true,
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
        found: response.results.products.length > 0,
        data: response.results.products,
      };
    } catch (error: any) {
      throw new Error(`Failed to find products: ${error.message}`);
    }
  },
});
