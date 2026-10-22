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
    const { images } = await scanPages({
      apiKey: context.auth.secret_text,
      startPage: 1,
      stopAt: null,
      maxPages: 1,
    });
    await context.store.put<PollState>(STORE_KEY, {
      seen: images.filter((i) => i.status === 'completed').map((i) => i.uid).slice(0, MAX_SEEN),
      pending: images.filter((i) => i.status === 'pending').map((i) => i.uid).slice(0, MAX_PENDING),
      head: newestCreatedAt(images) ?? new Date().toISOString(),
      backfill: null,
    });
  },
  async onDisable(context) {
    await context.store.delete(STORE_KEY);
  },
  async test(context) {
    const { images } = await scanPages({
      apiKey: context.auth.secret_text,
      startPage: 1,
      stopAt: null,
      maxPages: 1,
    });
    return images.filter((i) => i.status === 'completed').slice(0, 5);
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const stored = await context.store.get<Partial<PollState>>(STORE_KEY);
    const state: PollState = {
      seen: stored?.seen ?? [],
      pending: stored?.pending ?? [],
      head: stored?.head ?? null,
      backfill: stored?.backfill ?? null,
    };
    const seen = new Set(state.seen);
    const fresh = await scanPages({
      apiKey,
      startPage: 1,
      stopAt: state.head,
      maxPages: state.head === null ? 1 : MAX_PAGES_PER_SCAN,
    });
    let backfill = state.backfill;
    if (!fresh.reachedStop) {
      backfill = backfill
        ? { page: Math.min(backfill.page, fresh.nextPage), until: backfill.until }
        : { page: fresh.nextPage, until: state.head };
    }
    const backfillImages: NormalizedImage[] = [];
    if (backfill && fresh.reachedStop) {
      const older = await scanPages({
        apiKey,
        startPage: backfill.page,
        stopAt: backfill.until,
        maxPages: MAX_PAGES_PER_SCAN,
      });
      backfillImages.push(...older.images);
      backfill = older.reachedStop
        ? null
        : { page: older.nextPage, until: backfill.until };
    }
    const recent = dedupe([...fresh.images, ...backfillImages]);
    const recentByUid = new Map(recent.map((i) => [i.uid, i]));
    const pendingToCheck = state.pending.filter((uid) => !recentByUid.has(uid));
    const pendingChecks = await Promise.all(
      pendingToCheck
        .slice(0, MAX_PENDING_CHECKS)
        .map((uid) => fetchImage({ apiKey, uid }))
    );
    const candidates = [...recent, ...pendingChecks.filter((i): i is NormalizedImage => i !== null)];
    const emitted = candidates.filter((i) => i.status === 'completed' && !seen.has(i.uid));
    const stillPending = [
      ...candidates.filter((i) => i.status === 'pending').map((i) => i.uid),
      ...pendingToCheck.slice(MAX_PENDING_CHECKS),
    ];
    await context.store.put<PollState>(STORE_KEY, {
      seen: [...emitted.map((i) => i.uid), ...state.seen].slice(0, MAX_SEEN),
      pending: Array.from(new Set(stillPending)).slice(0, MAX_PENDING),
      head: newestCreatedAt(fresh.images) ?? state.head,
      backfill,
    });
    return emitted.reverse();
  },
});

async function scanPages({
  apiKey,
  startPage,
  stopAt,
  maxPages,
}: {
  apiKey: string;
  startPage: number;
  stopAt: string | null;
  maxPages: number;
}): Promise<{ images: NormalizedImage[]; reachedStop: boolean; nextPage: number }> {
  const stopTime = stopAt ? Date.parse(stopAt) : NaN;
  const images: NormalizedImage[] = [];
  for (let page = startPage; page < startPage + maxPages; page++) {
    const raw = await bannerbearClient.request<RawImage[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/images',
      queryParams: { page: String(page), limit: String(bannerbearClient.MAX_LIMIT) },
    });
    const batch = raw.map((i) => bannerbearClient.normalizeImage(i));
    images.push(...batch);
    const reachedCheckpoint =
      !Number.isNaN(stopTime) &&
      batch.some((i) => i.created_at !== null && Date.parse(i.created_at) < stopTime);
    if (raw.length < bannerbearClient.MAX_LIMIT || reachedCheckpoint) {
      return { images: dedupe(images), reachedStop: true, nextPage: page + 1 };
    }
  }
  return {
    images: dedupe(images),
    reachedStop: stopAt === null && maxPages === 1,
    nextPage: startPage + maxPages,
  };
}

function dedupe(images: NormalizedImage[]): NormalizedImage[] {
  const unique = new Map<string, NormalizedImage>();
  for (const image of images) {
    if (!unique.has(image.uid)) unique.set(image.uid, image);
  }
  return Array.from(unique.values());
}

function newestCreatedAt(images: NormalizedImage[]): string | null {
  let newest: string | null = null;
  let newestTime = -Infinity;
  for (const image of images) {
    if (image.created_at === null) continue;
    const time = Date.parse(image.created_at);
    if (!Number.isNaN(time) && time > newestTime) {
      newestTime = time;
      newest = image.created_at;
    }
  }
  return newest;
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
const MAX_PAGES_PER_SCAN = 10;
const MAX_SEEN = 2000;
const MAX_PENDING = 200;
const MAX_PENDING_CHECKS = 25;

type PollState = {
  seen: string[];
  pending: string[];
  head: string | null;
  backfill: { page: number; until: string | null } | null;
};
