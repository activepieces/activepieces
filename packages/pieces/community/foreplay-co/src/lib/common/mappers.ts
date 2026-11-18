import { ForeplayResponse, foreplayClient } from './client';

const { isRecord } = foreplayClient;

function recordOf(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function arrayOf(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function str(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return null;
}

function num(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  return null;
}

function bool(value: unknown): boolean | null {
  return typeof value === 'boolean' ? value : null;
}

function strings(value: unknown): string[] {
  return arrayOf(value).filter((v): v is string => typeof v === 'string');
}

function epochToIso(value: unknown): string | null {
  const n = num(value);
  if (n === null) return null;
  const ms = n < 100_000_000_000 ? n * 1000 : n;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function dataOf(body: unknown): unknown {
  return recordOf(body)['data'];
}

function metadataOf(body: unknown): Record<string, unknown> {
  return recordOf(recordOf(body)['metadata']);
}

function listOf(body: unknown): unknown[] {
  return arrayOf(dataOf(body));
}

function ad(raw: unknown) {
  const a = recordOf(raw);
  const brand = a['brand_id'];
  return {
    id: str(a['id']),
    adId: str(a['ad_id']),
    name: str(a['name']),
    brandId: str(brand),
    description: str(a['description']),
    headline: str(a['headline']),
    ctaTitle: str(a['cta_title']),
    ctaType: str(a['cta_type']),
    linkUrl: str(a['link_url']),
    displayFormat: str(a['display_format']),
    type: str(a['type']),
    publisherPlatforms: strings(a['publisher_platform']),
    niches: strings(a['niches']),
    languages: strings(a['languages']),
    marketTarget: str(a['market_target']),
    productCategory: str(a['product_category']),
    categories: arrayOf(a['categories']),
    live: bool(a['live']),
    startedRunning: epochToIso(a['started_running']),
    runningDuration: isRecord(a['running_duration']) ? a['running_duration'] : null,
    thumbnail: str(a['thumbnail']),
    image: str(a['image']),
    video: str(a['video']),
    videoDuration: num(a['video_duration']),
    avatar: str(a['avatar']),
    fullTranscription: str(a['full_transcription']),
    cardCount: arrayOf(a['cards']).length,
    cards: arrayOf(a['cards']).map((c) => {
      const card = recordOf(c);
      return { title: str(card['title']), headline: str(card['headline']), description: str(card['description']), image: str(card['image']), video: str(card['video']), ctaText: str(card['cta_text']) };
    }),
    emotionalDrivers: isRecord(a['emotional_drivers']) ? a['emotional_drivers'] : null,
    persona: isRecord(a['persona']) ? a['persona'] : null,
    foreplayUrl: str(a['foreplay_url']),
  };
}

function brand(raw: unknown) {
  const b = recordOf(raw);
  const description = b['description'];
  return {
    id: str(b['id']),
    name: str(b['name']),
    description: isRecord(description) ? str(description['text']) : str(description),
    category: str(b['category']),
    niches: strings(b['niches']),
    url: str(b['url']),
    websites: strings(b['websites']),
    avatar: str(b['avatar']),
    pageId: str(b['ad_library_id']),
    verificationStatus: str(b['verification_status']),
    adsCount: num(b['ads_count']),
    activeAdsCount: num(b['active_ads_count']),
  };
}

function board(raw: unknown) {
  const b = recordOf(raw);
  return { id: str(b['id']), name: str(b['name']), description: str(b['description']), createdAt: epochToIso(b['created_at']) };
}

function credits(response: ForeplayResponse) {
  return { creditCost: response.creditCost, creditsRemaining: response.creditsRemaining };
}

function cursorPage<T>({ response, map, limit }: { response: ForeplayResponse; map: (raw: unknown) => T; limit: number }) {
  const items = listOf(response.body).map(map);
  const cursor = metadataOf(response.body)['cursor'];
  const next = typeof cursor === 'string' && cursor !== '' ? cursor : typeof cursor === 'number' ? String(cursor) : null;
  const hasMore = next !== null && items.length >= limit;
  return { items, count: items.length, hasMore, nextCursor: hasMore ? next : null, ...credits(response) };
}

function offsetPage<T>({ response, map, limit, offset }: { response: ForeplayResponse; map: (raw: unknown) => T; limit: number; offset: number }) {
  const items = listOf(response.body).map(map);
  const hasMore = items.length >= limit;
  return { items, count: items.length, hasMore, nextOffset: hasMore ? offset + items.length : null, ...credits(response) };
}

const notFoundMessage = 'Foreplay returned no record for this ID. Ad lookups need the public ad library ID (the adId / ad_id field of search results), not the Foreplay internal id.';

function single<T>({ response, map }: { response: ForeplayResponse; map: (raw: unknown) => T }) {
  const data = dataOf(response.body);
  const item = Array.isArray(data) ? data[0] : data;
  if (!isRecord(item)) throw new Error(notFoundMessage);
  return { ...map(item), ...credits(response) };
}

function analyticsRow(raw: unknown) {
  const r = recordOf(raw);
  const formats: Record<string, number> = {};
  for (const key of ['video', 'image', 'carousel', 'dco', 'dpa', 'multi_images', 'multi_videos', 'multi_medias', 'event', 'text', 'page_like']) {
    const n = num(r[key]);
    if (n !== null) formats[key] = n;
  }
  return { date: str(r['date']), activeCount: num(r['active_count']), inactiveCount: num(r['inactive_count']), formats };
}

function rankedAd(raw: unknown) {
  const r = recordOf(raw);
  const ranking = isRecord(r['ranking']) ? r['ranking'] : r;
  const base = isRecord(r['ranking']) ? ad(r) : null;
  return {
    id: str(r['id']),
    adId: str(r['ad_id']),
    rank: num(ranking['rank']),
    previousRank: num(ranking['previous_rank']),
    peakRank: num(ranking['peak_rank']),
    daysRunning: num(ranking['days_running']),
    category: str(ranking['category']),
    asset: str(ranking['asset']),
    type: str(ranking['type']),
    ad: base,
  };
}

function relatedPage(raw: unknown) {
  const p = recordOf(raw);
  return {
    pageId: str(p['pageId']),
    name: str(p['currentPageName']) ?? str(p['pageName']),
    brandId: str(p['brandId']),
    profileUrl: str(p['profileUri']),
    profilePicUrl: str(p['profilePicUrl']),
    categories: strings(p['categories']),
    likeCount: num(p['likeCount']),
    adsCount: num(p['adsCount']),
    liveAdsCount: num(p['liveAdsCount']),
    firstSeenAt: str(p['firstSeenAt']),
    lastSeenAt: str(p['lastSeenAt']),
  };
}

function usage(raw: unknown) {
  const u = recordOf(raw);
  return {
    totalCredits: num(u['total_credits']),
    remainingCredits: num(u['remaining_credits']),
    usedCredits: num(u['total_credits']) !== null && num(u['remaining_credits']) !== null ? (num(u['total_credits']) ?? 0) - (num(u['remaining_credits']) ?? 0) : null,
    periodStart: str(u['start_date']),
    periodEnd: str(u['end_date']),
    userId: str(recordOf(u['user'])['id']),
  };
}

const foreplayMappers = {
  notFoundMessage,
  recordOf,
  arrayOf,
  str,
  num,
  dataOf,
  metadataOf,
  listOf,
  ad,
  brand,
  board,
  credits,
  cursorPage,
  offsetPage,
  single,
  analyticsRow,
  rankedAd,
  relatedPage,
  usage,
};

export { foreplayMappers };
