import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { DropdownState } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.senja.io/v1';

export async function senjaApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

export function mapTestimonial({
  testimonial,
  eventType,
}: {
  testimonial: Record<string, unknown>;
  eventType?: string | null;
}) {
  const video = isRecord(testimonial['video']) ? testimonial['video'] : null;
  const mp4Urls = video && isRecord(video['mp4_urls']) ? video['mp4_urls'] : null;
  const links = isRecord(testimonial['links']) ? testimonial['links'] : null;
  return {
    ...(eventType !== undefined ? { event_type: eventType ?? null } : {}),
    id: testimonial['id'] ?? null,
    type: testimonial['type'] ?? null,
    title: testimonial['title'] ?? null,
    text: testimonial['text'] ?? null,
    rating: testimonial['rating'] ?? null,
    url: testimonial['url'] ?? null,
    public_url: links?.['public'] ?? null,
    dashboard_url: links?.['senja'] ?? null,
    date: testimonial['date'] ?? null,
    approved: testimonial['approved'] ?? null,
    reward: testimonial['reward'] ?? null,
    integration: testimonial['integration'] ?? null,
    tags: Array.isArray(testimonial['tags']) ? testimonial['tags'] : [],
    lang: testimonial['lang'] ?? null,
    video_url: testimonial['video_url'] ?? null,
    thumbnail_url: testimonial['thumbnail_url'] ?? null,
    form_id: testimonial['form_id'] ?? null,
    project_id: testimonial['project_id'] ?? null,
    customer_name: testimonial['customer_name'] ?? null,
    customer_email: testimonial['customer_email'] ?? null,
    customer_company: testimonial['customer_company'] ?? null,
    customer_tagline: testimonial['customer_tagline'] ?? null,
    customer_username: testimonial['customer_username'] ?? null,
    customer_url: testimonial['customer_url'] ?? null,
    customer_avatar: testimonial['customer_avatar'] ?? null,
    customer_company_logo: testimonial['customer_company_logo'] ?? null,
    customer_custom_data: testimonial['customer_custom_data'] ?? null,
    media: Array.isArray(testimonial['media']) ? testimonial['media'] : [],
    video_duration: video?.['duration'] ?? null,
    video_aspect_ratio: video?.['aspect_ratio'] ?? null,
    video_hls_url: video?.['hls_url'] ?? null,
    video_mp4_low: mp4Urls?.['low'] ?? null,
    video_mp4_medium: mp4Urls?.['medium'] ?? null,
    video_mp4_high: mp4Urls?.['high'] ?? null,
    video_transcript: video?.['transcript'] ?? null,
    translations: Array.isArray(testimonial['translations']) ? testimonial['translations'] : [],
    created_at: testimonial['created_at'] ?? null,
    updated_at: testimonial['updated_at'] ?? null,
  };
}

export async function fetchTestimonials({
  token,
  queryParams,
  fetchAll,
}: {
  token: string;
  queryParams: Record<string, string>;
  fetchAll: boolean;
}): Promise<Record<string, unknown>[]> {
  if (!fetchAll) {
    const response = await senjaApiCall<{
      testimonials?: Record<string, unknown>[];
    }>({ token, method: HttpMethod.GET, path: '/testimonials', queryParams });
    return response.body.testimonials ?? [];
  }
  const seenIds = new Set<unknown>();
  const testimonials: Record<string, unknown>[] = [];
  for (let page = 1; ; page++) {
    const response = await senjaApiCall<{
      testimonials?: Record<string, unknown>[];
    }>({
      token,
      method: HttpMethod.GET,
      path: '/testimonials',
      queryParams: {
        ...queryParams,
        limit: String(FETCH_ALL_PAGE_SIZE),
        page: String(page),
      },
    });
    const batch = response.body.testimonials ?? [];
    const fresh = batch.filter((testimonial) => !seenIds.has(testimonial['id']));
    fresh.forEach((testimonial) => seenIds.add(testimonial['id']));
    testimonials.push(...fresh);
    if (batch.length < FETCH_ALL_PAGE_SIZE || fresh.length === 0) {
      return testimonials;
    }
  }
}

export async function listSenjaLinks({
  token,
}: {
  token: string;
}): Promise<SenjaLink[]> {
  const response = await senjaApiCall<
    Record<string, SenjaLinkResponse[] | undefined>
  >({
    token,
    method: HttpMethod.GET,
    path: '/links',
  });
  return LINK_GROUPS.flatMap(({ group, type }) =>
    (response.body[group] ?? []).map((link) => ({
      type,
      id: link.id ?? null,
      name: link.name ?? null,
      url: link.url ?? null,
      widget_type: link.type ?? null,
    })),
  );
}

export async function getFormDropdownOptions({
  token,
}: {
  token: string | undefined;
}): Promise<DropdownState<string>> {
  if (!token) {
    return {
      disabled: true,
      options: [],
      placeholder: 'Please connect your account first',
    };
  }
  const links = await listSenjaLinks({ token });
  const forms = links.filter(
    (link): link is SenjaLink & { id: string } =>
      link.type === 'form' && link.id !== null,
  );
  return {
    disabled: false,
    options: forms.map((form) => ({ label: form.name ?? form.id, value: form.id })),
    placeholder:
      forms.length === 0 ? 'No forms found in your Senja project' : undefined,
  };
}

export function toMediaItems({
  media,
}: {
  media: unknown;
}): Record<string, unknown>[] {
  if (!Array.isArray(media)) {
    return [];
  }
  return media
    .map((item) => toMediaItem(item))
    .filter((item) => item !== null);
}

function toMediaItem(item: unknown): Record<string, unknown> | null {
  const value = typeof item === 'string' ? parseMediaString(item) : item;
  if (!isRecord(value)) {
    return null;
  }
  const url = typeof value['url'] === 'string' ? value['url'].trim() : '';
  if (!url) {
    return null;
  }
  const { alt, ...rest } = value;
  const altText = typeof alt === 'string' ? alt.trim() : '';
  return altText ? { ...rest, url, alt: altText } : { ...rest, url };
}

function parseMediaString(item: string): unknown {
  try {
    const parsed: unknown = JSON.parse(item);
    return isRecord(parsed) ? parsed : { url: item };
  } catch {
    return { url: item };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const FETCH_ALL_PAGE_SIZE = 1000;

const LINK_GROUPS: { group: string; type: SenjaLinkType }[] = [
  { group: 'forms', type: 'form' },
  { group: 'widgets', type: 'widget' },
  { group: 'walls_of_love', type: 'wall_of_love' },
  { group: 'case_studies', type: 'case_study' },
  { group: 'quick_links', type: 'quick_link' },
  { group: 'sizzle_reels', type: 'sizzle_reel' },
];

export const SENJA_BASE_URL = BASE_URL;

export const LINK_TYPE_OPTIONS: { label: string; value: SenjaLinkType }[] = [
  { label: 'Forms', value: 'form' },
  { label: 'Widgets', value: 'widget' },
  { label: 'Walls of Love', value: 'wall_of_love' },
  { label: 'Case Studies', value: 'case_study' },
  { label: 'Quick Links', value: 'quick_link' },
  { label: 'Sizzle Reels', value: 'sizzle_reel' },
];

export const INTEGRATION_OPTIONS = [
  { label: 'Twitter', value: 'twitter' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'Google', value: 'google' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Airbnb', value: 'airbnb' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'App Store', value: 'app_store' },
  { label: 'Apple Podcasts', value: 'apple_podcasts' },
  { label: 'AppSumo', value: 'appsumo' },
  { label: 'Capterra', value: 'capterra' },
  { label: 'Chrome Web Store', value: 'chrome_web_store' },
  { label: 'Discord', value: 'discord' },
  { label: 'Fiverr', value: 'fiverr' },
  { label: 'G2', value: 'g2' },
  { label: 'HomeStars', value: 'homestars' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Play Store', value: 'play_store' },
  { label: 'Product Hunt', value: 'product_hunt' },
  { label: 'Realtor', value: 'realtor' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Shopify', value: 'shopify' },
  { label: 'Skillshare', value: 'skillshare' },
  { label: 'Slack', value: 'slack' },
  { label: 'SourceForge', value: 'sourceforge' },
  { label: 'Telegram', value: 'telegram' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Trustpilot', value: 'trustpilot' },
  { label: 'Udemy', value: 'udemy' },
  { label: 'Web Page', value: 'web_page' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Whop', value: 'whop' },
  { label: 'WordPress', value: 'wordpress' },
  { label: 'Yelp', value: 'yelp' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Zillow', value: 'zillow' },
];

export type SenjaLinkType =
  | 'form'
  | 'widget'
  | 'wall_of_love'
  | 'case_study'
  | 'quick_link'
  | 'sizzle_reel';

export type SenjaLink = {
  type: SenjaLinkType;
  id: string | null;
  name: string | null;
  url: string | null;
  widget_type: string | null;
};

type SenjaLinkResponse = {
  id?: string;
  name?: string;
  url?: string;
  type?: string;
};
