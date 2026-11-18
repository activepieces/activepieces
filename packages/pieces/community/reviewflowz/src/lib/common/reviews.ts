import { HttpMethod } from '@activepieces/pieces-common';
import { reviewflowzApi, ReviewflowzAuthValue } from './client';
import { ReviewflowzNamedRow, ReviewflowzPage } from './types';

async function getReview({ auth, id }: { auth: ReviewflowzAuthValue; id: string }): Promise<Record<string, unknown>> {
  const page = await reviewflowzApi.call<ReviewflowzPage<Record<string, unknown>>>({
    auth,
    method: HttpMethod.GET,
    path: '/reviews',
    query: { id, include: 'reply' },
  });
  const review = page.data?.[0];
  if (!review) {
    throw new Error(`No review ${id} on this account.`);
  }
  return review;
}

async function tagId({ auth, value, create }: { auth: ReviewflowzAuthValue; value: string; create: boolean }): Promise<string> {
  if (/^tag_\d+$/.test(value)) {
    return value;
  }
  const page = await reviewflowzApi.call<ReviewflowzPage<ReviewflowzNamedRow>>({
    auth,
    method: HttpMethod.GET,
    path: '/tags',
    query: { q: value },
  });
  const found = (page.data ?? []).find((tag) => String(tag.name).toLowerCase() === value.toLowerCase());
  if (found) {
    return found.id;
  }
  if (!create) {
    throw new Error(`No tag named ${value}.`);
  }
  const created = await reviewflowzApi.call<ReviewflowzNamedRow>({ auth, method: HttpMethod.POST, path: '/tags', body: { name: value } });
  return created.id;
}

export const reviewflowzReviews = { getReview, tagId };
