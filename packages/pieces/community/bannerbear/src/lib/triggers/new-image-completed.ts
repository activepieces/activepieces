import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import {
  bannerbearClient,
  NormalizedImage,
  RawImage,
} from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const newImageCompletedTrigger = createTrigger({
  auth: bannerbearAuth,
  name: 'new_image_completed',
  classification: 'READ',
  displayName: 'New Image Completed',
  description: 'Triggers when an image finishes rendering.',
  aiMetadata: {
    description:
      'Fires once per Bannerbear image that reaches status "completed", including images that were still pending on an earlier check.',
  },
  outputSchema: bannerbearOutputSchemas['image'],
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    uid: 'kG39R5XbvPQpLENKBWJj',
    status: 'completed',
    template_uid: '6A37YJe5qNDmpvWKP0',
    image_url: 'https://images.bannerbear.com/direct/example.png',
    image_url_png: 'https://images.bannerbear.com/direct/example.png',
    image_url_jpg: 'https://images.bannerbear.com/direct/example.jpg',
    pdf_url: null,
    metadata: null,
    error: null,
    self: 'https://api.bannerbear.com/v2/images/kG39R5XbvPQpLENKBWJj',
    created_at: '2026-10-22T10:00:00.000Z',
    completed_at: null,
  },
  async onEnable(context) {
    const images = await fetchRecent(context.auth.secret_text);
    await context.store.put<PollState>(STORE_KEY, {
      seen: images.filter((i) => i.status === 'completed').map((i) => i.uid).slice(0, MAX_SEEN),
      pending: images.filter((i) => i.status === 'pending').map((i) => i.uid).slice(0, MAX_PENDING),
    });
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    const images = await fetchRecent(context.auth.secret_text);
    return images.filter((i) => i.status === 'completed').slice(0, 5);
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const state = (await context.store.get<PollState>(STORE_KEY)) ?? { seen: [], pending: [] };
    const seen = new Set(state.seen);
    const recent = await fetchRecent(apiKey);
    const recentByUid = new Map(recent.map((i) => [i.uid, i]));
    const pendingChecks = await Promise.all(
      state.pending
        .filter((uid) => !recentByUid.has(uid))
        .slice(0, MAX_PENDING_CHECKS)
        .map((uid) => fetchImage({ apiKey, uid }))
    );
    const candidates = [...recent, ...pendingChecks.filter((i): i is NormalizedImage => i !== null)];
    const emitted = candidates.filter((i) => i.status === 'completed' && !seen.has(i.uid));
    const uncheckedPending = state.pending
      .filter((uid) => !recentByUid.has(uid))
      .slice(MAX_PENDING_CHECKS);
    const stillPending = [
      ...candidates.filter((i) => i.status === 'pending').map((i) => i.uid),
      ...uncheckedPending,
    ];
    await context.store.put<PollState>(STORE_KEY, {
      seen: [...emitted.map((i) => i.uid), ...state.seen].slice(0, MAX_SEEN),
      pending: Array.from(new Set(stillPending)).slice(0, MAX_PENDING),
    });
    return emitted.reverse();
  },
});

async function fetchRecent(apiKey: string): Promise<NormalizedImage[]> {
  const pages = await Promise.all(
    PAGES.map((page) =>
      bannerbearClient.request<RawImage[]>({
        apiKey,
        method: HttpMethod.GET,
        path: '/images',
        queryParams: { page: String(page), limit: String(bannerbearClient.MAX_LIMIT) },
      })
    )
  );
  const unique = new Map<string, NormalizedImage>();
  for (const image of pages.flat().map((i) => bannerbearClient.normalizeImage(i))) {
    if (!unique.has(image.uid)) unique.set(image.uid, image);
  }
  return Array.from(unique.values());
}

async function fetchImage({
  apiKey,
  uid,
}: {
  apiKey: string;
  uid: string;
}): Promise<NormalizedImage | null> {
  try {
    const raw = await bannerbearClient.request<RawImage>({
      apiKey,
      method: HttpMethod.GET,
      path: `/images/${encodeURIComponent(uid)}`,
    });
    return bannerbearClient.normalizeImage(raw);
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTTP 404')) {
      return null;
    }
    throw error;
  }
}

const STORE_KEY = 'bannerbear_new_image_completed_state';
const PAGES = [1, 2];
const MAX_SEEN = 2000;
const MAX_PENDING = 200;
const MAX_PENDING_CHECKS = 25;

type PollState = { seen: string[]; pending: string[] };
