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
    if (context.isRepublish && (await context.store.get(STORE_KEY))) return;
    const { images } = await scanPages({
      apiKey: context.auth.secret_text,
      startPage: 1,
      stopAt: null,
      maxPages: 1,
    });
    await context.store.put<PollState>(STORE_KEY, {
      seen: images.filter((i) => i.status === 'completed').map((i) => i.uid).slice(0, MAX_SEEN),
      pending: images.filter((i) => i.status === 'pending').map((i) => toPendingEntry(i)).slice(0, MAX_PENDING),
      head: newestCreatedAt(images) ?? new Date().toISOString(),
      floor: oldestCreatedAt(images.map((i) => toPendingEntry(i))) ?? new Date().toISOString(),
      enabledAt: new Date().toISOString(),
      backfill: null,
      recovery: null,
    });
  },
  async onDisable() {
    return;
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
    const pollStartedAt = Date.now() - CLOCK_SKEW_MS;
    const stored = await context.store.get<StoredPollState>(STORE_KEY);
    const state: PollState = {
      seen: stored?.seen ?? [],
      pending: (stored?.pending ?? []).map((entry) =>
        typeof entry === 'string' ? { uid: entry, created_at: null } : entry
      ),
      head: stored?.head ?? null,
      floor: stored?.floor ?? null,
      enabledAt: stored?.enabledAt ?? null,
      backfill: stored?.backfill ?? null,
      recovery: stored?.recovery ?? null,
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
    let recovery = state.recovery;
    const recoveredImages: NormalizedImage[] = [];
    if (recovery && fresh.reachedStop) {
      const since = Date.parse(recovery.since);
      const scanned = await scanPages({
        apiKey,
        startPage: recovery.page,
        stopAt: recovery.until,
        maxPages: MAX_PAGES_PER_SCAN,
      });
      recoveredImages.push(
        ...scanned.images.filter(
          (i) =>
            i.status !== 'completed' ||
            (i.completed_at !== null && Date.parse(i.completed_at) >= since)
        )
      );
      recovery = scanned.reachedStop
        ? null
        : { page: scanned.nextPage, until: recovery.until, since: recovery.since };
    }
    // Images created at or before the enable-time floor existed before the trigger was
    // enabled. Only the ones that had already completed by then are dropped; unfinished
    // ones stay eligible so their later completion still fires.
    const floorTime = state.floor === null ? NaN : Date.parse(state.floor);
    const enabledTime = state.enabledAt === null ? NaN : Date.parse(state.enabledAt);
    const recent = dedupe([...fresh.images, ...backfillImages, ...recoveredImages]).filter(
      (i) =>
        Number.isNaN(floorTime) ||
        i.created_at === null ||
        Date.parse(i.created_at) > floorTime ||
        i.status !== 'completed' ||
        (!Number.isNaN(enabledTime) &&
          i.completed_at !== null &&
          Date.parse(i.completed_at) > enabledTime)
    );
    const recentByUid = new Map(recent.map((i) => [i.uid, i]));
    const pendingToCheck = state.pending.filter((entry) => !recentByUid.has(entry.uid));
    const pendingChecks = (
      await Promise.all(
        pendingToCheck
          .slice(0, MAX_PENDING_CHECKS)
          .map((entry) => fetchImage({ apiKey, uid: entry.uid }))
      )
    ).filter((i): i is NormalizedImage => i !== null);
    const candidates = [...recent, ...pendingChecks];
    const emitted = candidates.filter((i) => i.status === 'completed' && !seen.has(i.uid));
    // Rotate: entries checked this poll and still pending go behind the unchecked ones,
    // so a slow render never blocks the rest of the queue from being checked.
    const stillPending = dedupePending([
      ...recent.filter((i) => i.status === 'pending').map((i) => toPendingEntry(i)),
      ...pendingToCheck.slice(MAX_PENDING_CHECKS),
      ...pendingChecks.filter((i) => i.status === 'pending').map((i) => toPendingEntry(i)),
    ]);
    const overflowFloor = oldestCreatedAt(stillPending.slice(MAX_PENDING));
    if (overflowFloor !== null) {
      recovery = {
        page: 1,
        until: recovery ? olderOf({ current: recovery.until, other: overflowFloor }) : overflowFloor,
        since: recovery ? recovery.since : new Date(pollStartedAt).toISOString(),
      };
    }
    await context.store.put<PollState>(STORE_KEY, {
      seen: [...emitted.map((i) => i.uid), ...state.seen].slice(0, MAX_SEEN),
      pending: stillPending.slice(0, MAX_PENDING),
      head: newestCreatedAt(fresh.images) ?? state.head,
      floor: state.floor,
      enabledAt: state.enabledAt,
      backfill,
      recovery,
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
    if (raw.length < SERVER_DEFAULT_PAGE_SIZE || reachedCheckpoint) {
      return { images: dedupe(images), reachedStop: true, nextPage: page + 1 };
    }
  }
  return {
    images: dedupe(images),
    reachedStop: stopAt === null && maxPages === 1,
    nextPage: startPage + maxPages,
  };
}

function toPendingEntry(image: NormalizedImage): PendingEntry {
  return { uid: image.uid, created_at: image.created_at };
}

function dedupePending(entries: PendingEntry[]): PendingEntry[] {
  const unique = new Map<string, PendingEntry>();
  for (const entry of entries) {
    if (!unique.has(entry.uid)) unique.set(entry.uid, entry);
  }
  return Array.from(unique.values());
}

function oldestCreatedAt(entries: PendingEntry[]): string | null {
  let oldest: string | null = null;
  for (const entry of entries) {
    if (entry.created_at === null) continue;
    oldest = oldest === null ? entry.created_at : olderOf({ current: oldest, other: entry.created_at });
  }
  return oldest;
}

function olderOf({ current, other }: { current: string | null; other: string }): string | null {
  if (current === null) return null;
  return Date.parse(other) < Date.parse(current) ? other : current;
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
const SERVER_DEFAULT_PAGE_SIZE = 25;
const MAX_SEEN = 5000;
const MAX_PENDING = 2000;
const CLOCK_SKEW_MS = 5 * 60 * 1000;
const MAX_PENDING_CHECKS = 25;

type PollState = {
  seen: string[];
  pending: PendingEntry[];
  head: string | null;
  floor: string | null;
  enabledAt: string | null;
  backfill: { page: number; until: string | null } | null;
  recovery: { page: number; until: string | null; since: string } | null;
};

type PendingEntry = { uid: string; created_at: string | null };

type StoredPollState = Partial<Omit<PollState, 'pending'>> & {
  pending?: (string | PendingEntry)[];
};
