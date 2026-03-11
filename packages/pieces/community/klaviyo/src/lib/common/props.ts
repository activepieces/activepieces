import { Property } from '@activepieces/pieces-framework';
import { klaviyoApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from './auth';

export const listIdDropdown = Property.Dropdown({
  displayName: 'List',
  description: 'Select a Klaviyo list',
  required: true,
  refreshers: ['auth'],
  async options(context) {
    const auth = context.auth as string;
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Enter API key first' };
    }
    try {
      const response = await klaviyoApiCall<{
        data: { id: string; attributes: { name: string } }[];
      }>({
        apiKey: auth,
        method: HttpMethod.GET,
        endpoint: '/lists',
        queryParams: { 'page[size]': '100' },
      });
      return {
        disabled: false,
        options: (response.data ?? []).map((list) => ({
          label: list.attributes.name,
          value: list.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load lists' };
    }
  },
});

export const segmentIdDropdown = Property.Dropdown({
  displayName: 'Segment',
  description: 'Select a Klaviyo segment',
  required: true,
  refreshers: ['auth'],
  async options(context) {
    const auth = context.auth as string;
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Enter API key first' };
    }
    try {
      const response = await klaviyoApiCall<{
        data: { id: string; attributes: { name: string } }[];
      }>({
        apiKey: auth,
        method: HttpMethod.GET,
        endpoint: '/segments',
        queryParams: { 'page[size]': '100' },
      });
      return {
        disabled: false,
        options: (response.data ?? []).map((seg) => ({
          label: seg.attributes.name,
          value: seg.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load segments' };
    }
  },
});

export const metricIdDropdown = Property.Dropdown({
  displayName: 'Metric',
  description: 'Select a Klaviyo metric',
  required: true,
  refreshers: ['auth'],
  async options(context) {
    const auth = context.auth as string;
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Enter API key first' };
    }
    try {
      const response = await klaviyoApiCall<{
        data: { id: string; attributes: { name: string; integration?: { name: string } } }[];
      }>({
        apiKey: auth,
        method: HttpMethod.GET,
        endpoint: '/metrics',
        queryParams: { 'page[size]': '100' },
      });
      return {
        disabled: false,
        options: (response.data ?? []).map((m) => ({
          label: m.attributes.name,
          value: m.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load metrics' };
    }
  },
});
