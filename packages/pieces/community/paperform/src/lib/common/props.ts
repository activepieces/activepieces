import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { Property } from '@activepieces/pieces-framework';

export const targetDropdown = Property.StaticDropdown({
  displayName: 'Target',
  description: 'What the coupon applies to',
  required: false,
  options: {
    options: [
      { label: 'Price', value: 'price' },
      { label: 'Subscription', value: 'subscription' },
    ],
  },
});

export const formSlugOrIdDropdown = Property.Dropdown({
  displayName: 'Form Slug or ID',
  description: 'Select the form to delete submissions from',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/forms'
      );
      return {
        disabled: false,
        options: response.results.forms.map((form: any) => ({
          label: form.title || form.slug,
          value: form.slug,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading forms',
      };
    }
  },
});

export const submissionIdDropdown = Property.Dropdown({
  displayName: 'Submission ID',
  description: 'Select the submission to delete',
  required: true,
  refreshers: ['auth', 'slug_or_id'],
  options: async ({ auth, slug_or_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/forms/${slug_or_id}/submissions`
      );
      return {
        disabled: false,
        options: response.results.submissions.map((submission: any) => ({
          label: submission.id,
          value: submission.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading teams',
      };
    }
  },
});

export const partialsubmissionIdDropdown = Property.Dropdown({
  displayName: 'Partial Submission ID',
  description: 'Select the submission to delete by partial ID',
  required: true,
  refreshers: ['auth', 'slug_or_id'],

  options: async ({ auth, slug_or_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/forms/${slug_or_id}/partial-submissions`
      );
      return {
        disabled: false,
        options: response.results['partial-submissions'].map(
          (submission: any) => ({
            label: `${submission.last_answered || 'No response'} (${
              submission.id
            })`,
            value: submission.id,
          })
        ),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading submissions',
      };
    }
  },
});

export const couponCodeDropdown = Property.Dropdown({
  displayName: 'Coupon Code',
  description: 'Select the coupon to delete',
  required: true,
  refreshers: ['auth', 'slug_or_id'],
  options: async ({ auth, slug_or_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/forms/${slug_or_id}/coupons`
      );
      return {
        disabled: false,
        options: response.results.coupons.map((coupon: any) => ({
          label: coupon.code,
          value: coupon.code,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading coupons',
      };
    }
  },
});

export const productSKUDropdown = Property.Dropdown({
  displayName: 'Product SKU',
  description: 'Select the product to create a coupon for',
  required: true,
  refreshers: ['auth', 'slug_or_id'],
  options: async ({ auth, slug_or_id }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        `/forms/${slug_or_id}/products`
      );
      return {
        disabled: false,
        options: response.results.products.map((product: any) => ({
          label: product.name,
          value: product.SKU,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading products',
      };
    }
  },
});

export const  spaceIdDropdown = Property.Dropdown({
  displayName: 'Space ID',
  description: 'Select the space to delete submissions from',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please connect your account first',
      };
    }

    try {
      const response = await makeRequest(
        auth as string,
        HttpMethod.GET,
        '/spaces'
      );
      return {
        disabled: false,
        options: response.results.spaces.map((space: any) => ({
          label: space.name,
          value: space.id,
        })),
      };
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading spaces',
      };
    }
  },
});
