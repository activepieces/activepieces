// Domain kernel aligned with oomol-lab/open-connector src/providers/17track/runtime.ts.
// Official API doc (11 endpoints): https://asset.17track.net/api/document/v2.4_zh/index.html
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const API_BASE = 'https://api.17track.net/track/v2.4';

const AUTH_CODES = new Set([-18010001, -18010002, -18010004, -18010005]);
const UPSTREAM_CODES = new Set([-18010003, -18019815, -18019816, -18019817]);
const RATE_LIMIT_CODES = new Set([-18019907, -18019908]);

type Raw = Record<string, unknown>;

const isRecord = (value: unknown): value is Raw =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const num = (obj: Raw, key: string): number => {
  const value = obj[key];
  if (typeof value !== 'number') {
    throw new SeventeenTrackError(undefined, `17TRACK response field ${key} is not a number`);
  }
  return value;
};

const firstErrorOf = (payload: unknown) => {
  if (!isRecord(payload)) return undefined;
  const data = isRecord(payload['data']) ? payload['data'] : {};
  const errors = Array.isArray(data['errors']) ? data['errors'] : [];
  return isRecord(errors[0]) ? errors[0] : undefined;
};

const request = async ({ path, body, apiKey }: { path: string; body: unknown; apiKey: string }) => {
  try {
    const response = await httpClient.sendRequest<Raw>({
      method: HttpMethod.POST,
      url: `${API_BASE}/${path}`,
      headers: {
        '17token': apiKey,
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body,
    });
    return response.body;
  } catch (error) {
    const maybeBody = isRecord(error) && isRecord(error['body']) ? error['body'] : undefined;
    if (maybeBody) {
      throw toError(maybeBody, 0);
    }
    throw error;
  }
};

const toError = (payload: Raw, httpStatus: number): SeventeenTrackError => {
  const first = firstErrorOf(payload);
  const code = typeof first?.['code'] === 'number' ? first['code'] : payload['code'];
  const numericCode = typeof code === 'number' ? code : undefined;
  const message =
    typeof first?.['message'] === 'string'
      ? first['message']
      : `17TRACK API request failed with status ${httpStatus}`;
  if (numericCode !== undefined && AUTH_CODES.has(numericCode)) {
    return new SeventeenTrackError(numericCode, `authentication failed: ${message}`);
  }
  if (numericCode !== undefined && RATE_LIMIT_CODES.has(numericCode)) {
    return new SeventeenTrackError(numericCode, `rate limited: ${message}`);
  }
  if (numericCode !== undefined && UPSTREAM_CODES.has(numericCode)) {
    return new SeventeenTrackError(numericCode, `upstream error: ${message}`);
  }
  return new SeventeenTrackError(numericCode, message);
};

const assertEnvelope = (payload: unknown) => {
  if (!isRecord(payload)) {
    throw new SeventeenTrackError(undefined, '17TRACK response is missing code');
  }
  const data = isRecord(payload['data']) ? payload['data'] : {};
  const errors = Array.isArray(data['errors']) ? data['errors'] : [];
  if (payload['code'] !== 0 || errors.length > 0) {
    throw toError(payload, 200);
  }
};

const readData = (payload: unknown): Raw => {
  assertEnvelope(payload);
  if (!isRecord(payload)) return {};
  return isRecord(payload['data']) ? payload['data'] : {};
};

const toBatch = (payload: unknown): { accepted: Raw[]; rejected: Raw[] } => {
  const data = readData(payload);
  const pick = (key: string) =>
    (Array.isArray(data[key]) ? data[key] : []).filter(isRecord);
  return { accepted: pick('accepted'), rejected: pick('rejected') };
};

export const seventeenTrackClient = {
  async getQuota({ apiKey }: { apiKey: string }) {
    const data = readData(await request({ path: 'getquota', body: [], apiKey }));
    const fallbackKey =
      data['free_email_quotaused'] !== undefined
        ? 'free_email_quotaused'
        : 'free_email_quota_used';
    return {
      total: num(data, 'quota_total'),
      used: num(data, 'quota_used'),
      remaining: num(data, 'quota_remain'),
      todayUsed: num(data, 'today_used'),
      dailyLimit: num(data, 'max_track_daily'),
      freeEmailQuota: num(data, 'free_email_quota'),
      freeEmailQuotaUsed: num(data, fallbackKey),
    };
  },

  async registerTrackings({
    apiKey,
    trackings,
  }: {
    apiKey: string;
    trackings: { number: string; auto_detection: boolean; lang?: string; tag?: string; remark?: string }[];
  }) {
    return toBatch(await request({ path: 'register', body: trackings, apiKey }));
  },

  async getTrackingDetails({
    apiKey,
    trackings,
  }: {
    apiKey: string;
    trackings: { number: string; carrier?: number }[];
  }) {
    return toBatch(await request({ path: 'gettrackinfo', body: trackings, apiKey }));
  },

  async listTrackings({
    apiKey,
    page_no,
    package_status,
  }: {
    apiKey: string;
    page_no: number;
    package_status?: string;
  }) {
    const payload = await request({
      path: 'gettracklist',
      body: { page_no, ...(package_status ? { package_status } : {}) },
      apiKey,
    });
    assertEnvelope(payload);
    const page = isRecord(payload) && isRecord(payload['page']) ? payload['page'] : {};
    const data = readData(payload);
    return {
      trackings: (Array.isArray(data['accepted']) ? data['accepted'] : []).filter(isRecord),
      pagination: {
        totalItems: num(page, 'data_total'),
        totalPages: num(page, 'page_total'),
        pageNumber: num(page, 'page_no'),
        pageSize: num(page, 'page_size'),
      },
    };
  },

  async stopTrackings({ apiKey, trackings }: { apiKey: string; trackings: { number: string }[] }) {
    return toBatch(await request({ path: 'stoptrack', body: trackings, apiKey }));
  },

  async restartTrackings({ apiKey, trackings }: { apiKey: string; trackings: { number: string }[] }) {
    return toBatch(await request({ path: 'retrack', body: trackings, apiKey }));
  },

  async deleteTrackings({ apiKey, trackings }: { apiKey: string; trackings: { number: string }[] }) {
    return toBatch(await request({ path: 'deletetrack', body: trackings, apiKey }));
  },

  async pushTrackings({ apiKey, trackings }: { apiKey: string; trackings: { number: string }[] }) {
    return toBatch(await request({ path: 'push', body: trackings, apiKey }));
  },

  async changeCarrier({
    apiKey,
    carrier_changes,
  }: {
    apiKey: string;
    carrier_changes: { number: string; carrier_old?: number; carrier_new: number }[];
  }) {
    return toBatch(await request({ path: 'changecarrier', body: carrier_changes, apiKey }));
  },

  async updateTrackingInfo({
    apiKey,
    trackings,
  }: {
    apiKey: string;
    trackings: { number: string; items: Record<string, unknown> }[];
  }) {
    return toBatch(await request({ path: 'changeinfo', body: trackings, apiKey }));
  },

  async getRealtimeTrackingDetails({
    apiKey,
    tracking,
  }: {
    apiKey: string;
    tracking: { number: string; cacheLevel?: 0 | 1 };
  }) {
    return toBatch(await request({ path: 'getRealTimeTrackInfo', body: [tracking], apiKey }));
  },
};

export class SeventeenTrackError extends Error {
  constructor(
    public readonly innerCode: number | undefined,
    message: string,
  ) {
    super(message);
    this.name = 'SeventeenTrackError';
  }
}
