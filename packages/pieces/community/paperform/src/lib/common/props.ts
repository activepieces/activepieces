import { Property } from '@activepieces/pieces-framework';
import { paperformCommon } from './client';
import {
  PaperformCoupon,
  PaperformField,
  PaperformProduct,
  PaperformSpace,
} from './types';
import { isNil } from '@activepieces/shared';

export const paperformCommonProps = {
  spaceId: Property.Dropdown({
    displayName: 'Space',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
          options: [],
        };
      }

      try {
        const spaces = await paperformCommon.getSpaces({
          auth: auth as string,
          limit: 100,
        });

        return {
          disabled: false,
          options: spaces.results.spaces.map((space: PaperformSpace) => ({
            label: space.name,
            value: space.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading spaces.',
          options: [],
        };
      }
    },
  }),
  formId: Property.Dropdown({
    displayName: 'Form',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first.',
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
          placeholder: 'Error loading forms.',
          options: [],
        };
      }
    },
  }),
  productFieldKey: Property.Dropdown({
    displayName: 'Product Field',
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

        const productFields = fields.results.fields.filter(
          (field: PaperformField) => field.type === 'products'
        );

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
  productSku: Property.Dropdown({
    displayName: 'Product',
    required: true,
    refreshers: ['auth', 'formId'],
    options: async ({ auth, formId }) => {
      if (!auth || !formId) {
        return {
          disabled: true,
          placeholder: 'Please select a form first.',
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
          options: products.results.products.map(
            (product: PaperformProduct) => ({
              label:
                isNil(product.name) || product.name === ''
                  ? product.SKU
                  : product.name,
              value: product.SKU,
            })
          ),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading products.',
          options: [],
        };
      }
    },
  }),
  couponCode: Property.Dropdown({
    displayName: 'Coupon',
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
        const coupons = await paperformCommon.getCoupons({
          formSlugOrId: formId as string,
          auth: auth as string,
          limit: 100,
        });

        return {
          disabled: false,
          options: coupons.results.coupons.map((coupon: PaperformCoupon) => ({
            label: `${coupon.code} - ${
              coupon.enabled ? 'Enabled' : 'Disabled'
            }`,
            value: coupon.code,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error loading coupons',
          options: [],
        };
      }
    },
  }),
};
