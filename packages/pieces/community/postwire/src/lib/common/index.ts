import { HttpMethod, httpClient } from '@activepieces/pieces-common';

async function postwireRequest<T>(
  apiKey: string,
  method: HttpMethod,
  path: string,
  body?: unknown,
): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${POSTWIRE_API}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-PostWire-Source': 'activepieces',
    },
    body,
  });
  return response.body;
}

function needsOf(value: string): MediaNeed {
  return PLATFORMS.find((platform) => platform.value === value)?.needs ?? null;
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|mov|webm|m3u8|avi|mkv|m4v)(\?|$)/i.test(url);
}

function mediaProblem(platforms: string[], mediaUrl: string): string | null {
  const video = isVideoUrl(mediaUrl);
  const blocked = platforms.filter((platform) => {
    const need = needsOf(platform);
    if (need === null) return false;
    return need === 'video' ? !video : mediaUrl.length === 0;
  });
  if (blocked.length === 0) return null;
  const wantsVideo = blocked.some((platform) => needsOf(platform) === 'video');
  const what = wantsVideo ? 'a video' : 'an image or video';
  const which = blocked.length > 1 ? 'those networks' : 'that network';
  return `${blocked.join(' and ')} will not accept a post without ${what}. Set Media URL to a direct file link, or remove ${which}.`;
}

function allFailed(results: PostWireResult[]): string | null {
  const failed = results.filter((result) => result.ok === false);
  if (results.length === 0 || failed.length !== results.length) return null;
  const why = failed
    .map((result) => `${result.platform ?? '?'}: ${result.error ?? result.code ?? 'failed'}`)
    .join('; ');
  const limited = failed.find((result) => result.upgrade_url !== undefined);
  const upgrade = limited?.upgrade_url ? ` — upgrade: ${limited.upgrade_url}` : '';
  return `PostWire published to none of the ${results.length} selected network(s). ${why}${upgrade}`;
}

function mediaFields(mediaUrl: string): { video_url?: string; photo_url?: string } {
  if (mediaUrl.length === 0) return {};
  return isVideoUrl(mediaUrl) ? { video_url: mediaUrl } : { photo_url: mediaUrl };
}

export const POSTWIRE_API = 'https://postwire.io';

export const PLATFORMS: ReadonlyArray<{ label: string; value: string; needs: MediaNeed }> = [
  { label: 'TikTok', value: 'tiktok', needs: 'video' },
  { label: 'Instagram', value: 'instagram', needs: 'any' },
  { label: 'YouTube', value: 'youtube', needs: 'video' },
  { label: 'LinkedIn', value: 'linkedin', needs: null },
  { label: 'X (Twitter)', value: 'x', needs: null },
  { label: 'Facebook', value: 'facebook', needs: null },
  { label: 'Reddit', value: 'reddit', needs: null },
  { label: 'Bluesky', value: 'bluesky', needs: null },
  { label: 'Mastodon', value: 'mastodon', needs: null },
  { label: 'Telegram', value: 'telegram', needs: null },
  { label: 'Discord', value: 'discord', needs: null },
];

export const postwireCommon = {
  request: postwireRequest,
  mediaProblem,
  mediaFields,
  allFailed,
  platformOptions: () => PLATFORMS.map((platform) => ({ label: platform.label, value: platform.value })),
};

export type MediaNeed = 'video' | 'any' | null;

export type PostWireResult = {
  ok: boolean;
  platform?: string;
  url?: string;
  error?: string;
  code?: string;
  upgrade_url?: string;
};

export type PostWireResponse = { results: PostWireResult[] };
