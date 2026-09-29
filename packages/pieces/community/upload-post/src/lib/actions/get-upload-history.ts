import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { uploadPostAuth } from '../auth';
import { uploadPostClient } from '../common/client';
import { VIDEO_PLATFORMS } from '../common/props';

export const getUploadHistory = createAction({
  auth: uploadPostAuth,
  name: 'get_upload_history',
  classification: 'SEARCH',
  displayName: 'Get Upload History',
  description:
    'Get past uploads with their per-platform result, post URL and error, newest first.',
  audience: 'both',
  aiMetadata: {
    description:
      'List past uploads (one row per platform) newest first, optionally filtered by profile, platform, success/failure, date range or an exact request/job/external ID. Use Get Upload Status to poll a single in-flight upload instead. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    profile_username: Property.ShortText({
      displayName: 'Profile',
      description: 'Only return uploads of this profile (its username).',
      required: false,
    }),
    platform: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'Only return uploads to this platform.',
      required: false,
      options: { options: VIDEO_PLATFORMS },
    }),
    status: Property.StaticDropdown({
      displayName: 'Result',
      description: 'Only return successful or only failed uploads.',
      required: false,
      options: {
        options: [
          { label: 'Successful', value: 'success' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    start: Property.DateTime({
      displayName: 'From',
      description: 'Start of the date range. Requires "To"; the range can span at most 2 months.',
      required: false,
    }),
    end: Property.DateTime({
      displayName: 'To',
      description: 'End of the date range. Requires "From".',
      required: false,
    }),
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Exact match: only rows produced by this upload request.',
      required: false,
    }),
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description: 'Exact match: only rows produced by this scheduled job.',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'Exact match: only rows of the post you tagged with this External ID.',
      required: false,
    }),
    limit: Property.StaticDropdown({
      displayName: 'Page Size',
      description: 'How many rows to return per page.',
      required: false,
      defaultValue: 20,
      options: {
        options: [
          { label: '10', value: 10 },
          { label: '20', value: 20 },
          { label: '50', value: 50 },
          { label: '100', value: 100 },
        ],
      },
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    if (Boolean(p.start) !== Boolean(p.end)) {
      throw new Error('"From" and "To" must be set together.');
    }
    const response = await uploadPostClient.request<UploadHistoryResponse>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/uploadposts/history',
      queryParams: uploadPostClient.compactQuery({
        profile_username: p.profile_username,
        platform: p.platform,
        status: p.status,
        start: p.start,
        end: p.end,
        request_id: p.request_id,
        job_id: p.job_id,
        external_id: p.external_id,
        limit: p.limit ?? 20,
        page: p.page ?? 1,
      }),
    });
    const history = response.body.history ?? [];
    return {
      total: response.body.total ?? history.length,
      page: response.body.page ?? p.page ?? 1,
      limit: response.body.limit ?? p.limit ?? 20,
      uploads: history.map((item) => ({
        profile_username: item.profile_username ?? null,
        platform: item.platform ?? null,
        media_type: item.media_type ?? null,
        upload_timestamp: item.upload_timestamp ?? null,
        success: item.success ?? null,
        post_url: item.post_url ?? null,
        platform_post_id: Array.isArray(item.platform_post_id)
          ? item.platform_post_id.join(', ')
          : item.platform_post_id ?? null,
        post_title: item.post_title ?? null,
        error_message: item.error_message ?? null,
        request_id: item.request_id ?? null,
        job_id: item.job_id ?? null,
      })),
    };
  },
});

type UploadHistoryItem = {
  profile_username?: string;
  platform?: string;
  media_type?: string;
  upload_timestamp?: string;
  success?: boolean;
  post_url?: string | null;
  platform_post_id?: string | string[] | null;
  post_title?: string | null;
  error_message?: string | null;
  request_id?: string | null;
  job_id?: string | null;
};

type UploadHistoryResponse = {
  history?: UploadHistoryItem[];
  total?: number;
  page?: number;
  limit?: number;
};
