import { Property } from '@activepieces/pieces-framework';
import { klaviyoPaginatedFetch } from './client';

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
      const lists = await klaviyoPaginatedFetch<{
        id: string;
        attributes: { name: string };
      }>(auth, '/lists', { 'page[size]': '100', 'fields[list]': 'id,name' });

      return {
        disabled: false,
        options: lists.map((list) => ({
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
      const segments = await klaviyoPaginatedFetch<{
        id: string;
        attributes: { name: string };
      }>(auth, '/segments', {
        'page[size]': '100',
        'fields[segment]': 'id,name',
      });

      return {
        disabled: false,
        options: segments.map((seg) => ({
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
      const metrics = await klaviyoPaginatedFetch<{
        id: string;
        attributes: { name: string };
      }>(auth, '/metrics', {
        'page[size]': '100',
        'fields[metric]': 'id,name',
      });

      return {
        disabled: false,
        options: metrics.map((m) => ({
          label: m.attributes.name,
          value: m.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load metrics' };
    }
  },
});
