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
