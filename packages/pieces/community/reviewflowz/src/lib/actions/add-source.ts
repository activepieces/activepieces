import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzApi } from '../common/client';
import { reviewflowzProps } from '../common/props';

export const addSourceAction = createAction({
  auth: reviewflowzAuth,
  name: 'add_source',
  classification: 'WRITE',
  displayName: 'Add Source',
  description: 'Starts collecting reviews from a listing: a Google, Tripadvisor, Trustpilot... page.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add a review listing URL (Google Maps, Tripadvisor, Trustpilot...) to Reviewflowz so its reviews are collected. Use Look Up Business Listing first when you only have a business name. A URL already tracked is returned as it is, so retries are safe.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Listing URL',
      description: 'The page that shows the reviews, like https://www.trustpilot.com/review/example.com or a Google Maps link.',
      required: true,
    }),
    location: reviewflowzProps.optionalLocation(),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const answer = await reviewflowzApi.call<{
      data?: Record<string, unknown>[];
      rejected?: { detail?: string; reason?: string; source?: string }[];
    }>({
      auth,
      method: HttpMethod.POST,
      path: '/sources',
      body: { urls: [input.url], ...(input.location ? { location: input.location } : {}) },
      headers: { Prefer: 'wait=20' },
    });
    const added = answer.data?.[0];
    if (added) {
      return { ...added, already_added: false };
    }
    const rejected = answer.rejected?.[0];
    if (rejected?.reason === 'already_added' && rejected.source) {
      const existing = await reviewflowzApi.call<Record<string, unknown>>({
        auth,
        method: HttpMethod.GET,
        path: `/sources/${encodeURIComponent(String(rejected.source))}`,
      });
      return { ...existing, already_added: true };
    }
    throw new Error(rejected?.detail || rejected?.reason || 'We could not add that listing.');
  },
});
