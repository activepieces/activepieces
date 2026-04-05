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

export function mapTestimonial(t: Record<string, unknown>, eventType?: string | null) {
  const video = t['video'] as Record<string, unknown> | null | undefined;
  const mp4Urls = video?.['mp4_urls'] as Record<string, unknown> | undefined;
  return {
    ...(eventType !== undefined ? { event_type: eventType ?? null } : {}),
    id: t['id'] ?? null,
    type: t['type'] ?? null,
    title: t['title'] ?? null,
    text: t['text'] ?? null,
    rating: t['rating'] ?? null,
    url: t['url'] ?? null,
    date: t['date'] ?? null,
    approved: t['approved'] ?? null,
    integration: t['integration'] ?? null,
    tags: (t['tags'] as string[]) ?? [],
    lang: t['lang'] ?? null,
    video_url: t['video_url'] ?? null,
    thumbnail_url: t['thumbnail_url'] ?? null,
    form_id: t['form_id'] ?? null,
    project_id: t['project_id'] ?? null,
    customer_name: t['customer_name'] ?? null,
    customer_email: t['customer_email'] ?? null,
    customer_company: t['customer_company'] ?? null,
    customer_tagline: t['customer_tagline'] ?? null,
    customer_username: t['customer_username'] ?? null,
    customer_url: t['customer_url'] ?? null,
    customer_avatar: t['customer_avatar'] ?? null,
    customer_company_logo: t['customer_company_logo'] ?? null,
    customer_custom_data: t['customer_custom_data'] ?? null,
    media: (t['media'] as unknown[]) ?? [],
    video_duration: video?.['duration'] ?? null,
    video_aspect_ratio: video?.['aspect_ratio'] ?? null,
    video_hls_url: video?.['hls_url'] ?? null,
    video_mp4_low: mp4Urls?.['low'] ?? null,
    video_mp4_medium: mp4Urls?.['medium'] ?? null,
    video_mp4_high: mp4Urls?.['high'] ?? null,
    video_transcript: video?.['transcript'] ?? null,
    translations: (t['translations'] as unknown[]) ?? [],
    created_at: t['created_at'] ?? null,
    updated_at: t['updated_at'] ?? null,
  };
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
