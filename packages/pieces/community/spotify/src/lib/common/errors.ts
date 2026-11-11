const MAX_VENDOR_TEXT = 300;
const PLAYLIST_ITEMS_READ = 'read the playlist items';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function failureOf(error: unknown): { status: number; responseBody: unknown } | null {
  if (!isRecord(error) && !(error instanceof Error)) {
    return null;
  }
  const response: unknown = Reflect.get(error, 'response');
  if (!isRecord(response)) {
    return null;
  }
  const status = response['status'];
  return typeof status === 'number' ? { status, responseBody: response['body'] } : null;
}

function vendorDetail(responseBody: unknown): { message?: string; reason?: string } {
  const inner = isRecord(responseBody) ? responseBody['error'] : undefined;
  if (isRecord(inner)) {
    const message = typeof inner['message'] === 'string' ? inner['message'].trim().slice(0, MAX_VENDOR_TEXT) : undefined;
    const reason = typeof inner['reason'] === 'string' ? inner['reason'] : undefined;
    return { message: message === '' ? undefined : message, reason };
  }
  if (typeof inner === 'string' && inner.trim() !== '') {
    const description = isRecord(responseBody) && typeof responseBody['error_description'] === 'string' ? `: ${responseBody['error_description']}` : '';
    return { message: `${inner.trim()}${description}`.slice(0, MAX_VENDOR_TEXT) };
  }
  if (typeof responseBody === 'string' && responseBody.trim() !== '') {
    return { message: responseBody.trim().slice(0, MAX_VENDOR_TEXT) };
  }
  return {};
}

function hintFor({ reason, message, status, operation }: { reason?: string; message?: string; status: number; operation: string }): string {
  if (status === 403 && operation === PLAYLIST_ITEMS_READ && (message === undefined || /forbidden/i.test(message))) {
    return ' Development-mode Spotify apps can only read items of playlists the user owns or collaborates on.';
  }
  if (reason === 'PREMIUM_REQUIRED') {
    return ' Player controls need Spotify Premium on the connected account.';
  }
  if (reason === 'NO_ACTIVE_DEVICE') {
    return ' No active Spotify device was found. Open Spotify on a phone, computer or the web player (open.spotify.com), start playing something, or choose a device.';
  }
  if (reason === 'UNKNOWN' && message !== undefined && /restriction violated/i.test(message)) {
    return ' The player refused this command in its current state (for example pausing playback that is already paused, or skipping while an ad plays).';
  }
  return '';
}

function toError({ error, operation }: { error: unknown; operation: string }): unknown {
  if (error instanceof SpotifyApiError) {
    return error;
  }
  const failure = failureOf(error);
  if (failure === null) {
    return error;
  }
  const { message, reason } = vendorDetail(failure.responseBody);
  const reasonText = reason !== undefined && reason !== 'UNKNOWN' ? ` ${reason}` : '';
  const text = `Spotify could not ${operation} (${failure.status}${reasonText})${message !== undefined ? `: ${message}` : ''}.${hintFor({ reason, message, status: failure.status, operation })}`;
  return new SpotifyApiError({ message: text, status: failure.status, responseBody: failure.responseBody, reason });
}

function withProgress({ error, progress }: { error: unknown; progress: string }): unknown {
  if (error instanceof SpotifyApiError) {
    return new SpotifyApiError({ message: `${progress} ${error.message}`, status: error.status, responseBody: error.responseBody, reason: error.reason });
  }
  if (error instanceof Error) {
    return new Error(`${progress} ${error.message}`);
  }
  return error;
}

export class SpotifyApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  readonly reason: string | undefined;

  constructor({ message, status, responseBody, reason }: { message: string; status: number; responseBody: unknown; reason?: string }) {
    super(message);
    this.name = 'SpotifyApiError';
    this.status = status;
    this.responseBody = responseBody;
    this.reason = reason;
  }
}

export const spotifyErrors = {
  toError,
  withProgress,
};
