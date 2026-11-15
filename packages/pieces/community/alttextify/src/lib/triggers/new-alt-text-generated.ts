import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../common/auth';
import { alttextifyApi, AlttextifyImage, NormalizedImage, normalizeImage } from '../common/client';
import { alttextifySchemas } from '../common/schemas';

const STATE_KEY = 'alttextify_new_alt_text_state';
const PAGE_SIZE = 100;
const MAX_SCAN_PAGES = 100;
const MAX_ITEMS_PER_POLL = 100;

async function fetchPage({ apiKey, page, limit }: { apiKey: string; page: number; limit: number }): Promise<AlttextifyImage[]> {
  const items = await alttextifyApi.request<AlttextifyImage[]>({
    apiKey,
    method: HttpMethod.GET,
    path: '/image',
    query: { page: String(page), limit: String(limit) },
    operation: 'list images',
  });
  return Array.isArray(items) ? items : [];
}

function createdMs(image: AlttextifyImage): number | undefined {
  if (typeof image.created_at !== 'string') return undefined;
  const ms = Date.parse(image.created_at);
  return Number.isNaN(ms) ? undefined : ms;
}

async function collectNewImages({ apiKey, state }: { apiKey: string; state: PollState }): Promise<PollResult> {
  const seen = new Set(state.seenIds);
  const candidates = new Map<string, { ms: number; image: AlttextifyImage }>();
  let finished = false;
  for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
    const items = await fetchPage({ apiKey, page, limit: PAGE_SIZE });
    let reachedCursor = false;
    for (const item of items) {
      const ms = createdMs(item);
      if (ms === undefined || !item.asset_id) continue;
      if (ms < state.cursorMs) {
        reachedCursor = true;
        continue;
      }
      if (ms === state.cursorMs && seen.has(item.asset_id)) {
        continue;
      }
      candidates.set(item.asset_id, { ms, image: item });
    }
    if (reachedCursor || items.length < PAGE_SIZE) {
      finished = true;
      break;
    }
  }
  if (!finished) {
    throw new Error(
      `More than ${(MAX_SCAN_PAGES * PAGE_SIZE).toLocaleString('en-US')} new AltTextify images since the last check; the trigger stopped without skipping any. Disable and re-enable the trigger to start from the newest image.`,
    );
  }

  const ordered = [...candidates.values()].sort((a, b) => a.ms - b.ms).slice(0, MAX_ITEMS_PER_POLL);
  if (ordered.length === 0) {
    return { items: [], state };
  }
  const newCursor = ordered[ordered.length - 1].ms;
  const boundaryIds = ordered.filter((entry) => entry.ms === newCursor).map((entry) => entry.image.asset_id);
  const seenIds = newCursor === state.cursorMs ? [...state.seenIds, ...boundaryIds] : boundaryIds;
  return {
    items: ordered.map((entry) => normalizeImage(entry.image)),
    state: { cursorMs: newCursor, seenIds },
  };
}

async function seedState({ apiKey }: { apiKey: string }): Promise<PollState> {
  let newestMs: number | undefined;
  const seenIds: string[] = [];
  for (let page = 1; page <= MAX_SCAN_PAGES; page++) {
    const items = await fetchPage({ apiKey, page, limit: PAGE_SIZE });
    let passedNewest = false;
    for (const item of items) {
      const ms = createdMs(item);
      if (ms === undefined || !item.asset_id) continue;
      if (newestMs === undefined) newestMs = ms;
      if (ms === newestMs) {
        seenIds.push(item.asset_id);
      } else if (ms < newestMs) {
        passedNewest = true;
        break;
      }
    }
    if (passedNewest || items.length < PAGE_SIZE) break;
  }
  return newestMs === undefined ? { cursorMs: Date.now(), seenIds: [] } : { cursorMs: newestMs, seenIds };
}

export const newAltTextGeneratedTrigger = createTrigger({
  auth: alttextifyAuth,
  name: 'new-alt-text-generated',
  displayName: 'New Alt Text Generated',
  classification: 'READ',
  description: 'Triggers when alt text is generated for a new image in your AltTextify account.',
  aiMetadata: {
    description:
      'Fires once for each new image record created in the AltTextify account, from this piece, the AltTextify app or any other API client. Polls the image list and emits the image with its asset_id, alt_text and created_at. Emits at most 100 images per poll; the rest follow on the next polls.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  outputSchema: alttextifySchemas.image,
  sampleData: {
    asset_id: 'kcvqngg6d',
    alt_text: 'A golden retriever running across a grassy park on a sunny day.',
    alt_texts: ['A golden retriever running across a grassy park on a sunny day.'],
    image_source: '3f6c2a8e-5d1b-4c7a-9e2f-1a2b3c4d5e6f.webp',
    tag: null,
    created_at: '2025-03-21T08:39:29.751Z',
    status: null,
  },
  async onEnable(context) {
    if (context.isRepublish) {
      const existing = await context.store.get<PollState>(STATE_KEY);
      if (existing) return;
    }
    const state = await seedState({ apiKey: context.auth.secret_text });
    await context.store.put<PollState>(STATE_KEY, state);
  },
  async onDisable(context) {
    await context.store.delete(STATE_KEY);
  },
  async test(context) {
    const items = await fetchPage({ apiKey: context.auth.secret_text, page: 1, limit: 5 });
    return items.map((item) => normalizeImage(item));
  },
  async run(context) {
    const stored = await context.store.get<PollState>(STATE_KEY);
    const state: PollState = stored ?? { cursorMs: Date.now(), seenIds: [] };
    const result = await collectNewImages({ apiKey: context.auth.secret_text, state });
    if (result.items.length > 0 || !stored) {
      await context.store.put<PollState>(STATE_KEY, result.state);
    }
    return result.items;
  },
});

type PollState = {
  cursorMs: number;
  seenIds: string[];
};

type PollResult = {
  items: NormalizedImage[];
  state: PollState;
};
