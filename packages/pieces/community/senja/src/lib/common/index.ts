import {
  httpClient,
  HttpMethod,
  AuthenticationType,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';

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
  return {
    ...(eventType !== undefined ? { event_type: eventType ?? null } : {}),
    id: testimonial['id'] ?? null,
    type: testimonial['type'] ?? null,
    title: testimonial['title'] ?? null,
    text: testimonial['text'] ?? null,
    rating: testimonial['rating'] ?? null,
    url: testimonial['url'] ?? null,
    date: testimonial['date'] ?? null,
    approved: testimonial['approved'] ?? null,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const SENJA_BASE_URL = BASE_URL;

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
  { label: 'Chrome Web Store', value: 'chrome-web-store' },
  { label: 'EmbedSocial', value: 'embedsocial' },
  { label: 'Fiverr', value: 'fiverr' },
  { label: 'G2', value: 'g2' },
  { label: 'HomeStars', value: 'homestars' },
  { label: 'Instagram', value: 'instagram' },
  { label: 'Play Store', value: 'play-store' },
  { label: 'Product Hunt', value: 'product-hunt' },
  { label: 'Realtor', value: 'realtor' },
  { label: 'Reddit', value: 'reddit' },
  { label: 'Skillshare', value: 'skillshare' },
  { label: 'SourceForge', value: 'sourceforge' },
  { label: 'Testimonial.to', value: 'testimonial-to' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Trustpilot', value: 'trustpilot' },
  { label: 'Udemy', value: 'udemy' },
  { label: 'Upwork', value: 'upwork' },
  { label: 'Whop', value: 'whop' },
  { label: 'WordPress', value: 'wordpress' },
  { label: 'Yelp', value: 'yelp' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'Zillow', value: 'zillow' },
];
