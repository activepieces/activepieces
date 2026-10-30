import { AppConnectionValueForAuthProperty, PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { canvaClient } from './client';

const MAX_DROPDOWN_PAGES = 5;
const DROPDOWN_PAGE_SIZE = 100;

const canvaAuthDescription = `
To connect Canva, follow these steps:
1. Go to https://www.canva.com/developers/integrations and sign in.
2. Click **Create an integration** and fill in the app name and description.
3. Under **Configure** → **Authentication**, set the redirect URL to the one shown above.
4. Under **Configure** → **Scopes**, enable: \`design:content:read\`, \`design:content:write\`, \`design:meta:read\`, \`asset:read\`, \`asset:write\`, \`folder:read\`, \`folder:write\`, \`profile:read\`.
5. Copy the **Client ID** and **Client secret** and paste them above.
`;

const canvaAuth = PieceAuth.OAuth2({
  description: canvaAuthDescription,
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://api.canva.com/rest/v1/oauth/token',
  required: true,
  pkce: true,
  pkceMethod: 'S256',
  scope: [
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'asset:read',
    'asset:write',
    'folder:read',
    'folder:write',
    'profile:read',
  ],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const body = await canvaClient.request<{ profile?: { display_name?: string } }>({
        token: auth.access_token,
        method: HttpMethod.GET,
        path: '/users/me/profile',
        timeoutMs: 5000,
      });
      return body?.profile?.display_name || undefined;
    } catch {
      return undefined;
    }
  },
  validate: async ({ auth }) => {
    if (!auth.access_token) {
      return { valid: false, error: 'No access token found' };
    }
    try {
      await canvaClient.request<unknown>({ token: auth.access_token, method: HttpMethod.GET, path: '/users/me' });
      return { valid: true };
    } catch (error) {
      const status: unknown = typeof error === 'object' && error !== null ? Reflect.get(error, 'status') : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Access token is invalid or expired' };
      }
      return { valid: false, error: 'Failed to validate authentication credentials' };
    }
  },
});

async function listFolderPage({
  token,
  folderId,
  itemTypes,
  continuation,
  limit,
  sortBy,
}: {
  token: string;
  folderId: string;
  itemTypes?: string;
  continuation?: string;
  limit?: number;
  sortBy?: string;
}): Promise<ListFolderItemsResponse> {
  const queryParams: Record<string, string> = {};
  if (itemTypes) queryParams['item_types'] = itemTypes;
  if (continuation) queryParams['continuation'] = continuation;
  if (limit !== undefined) queryParams['limit'] = String(limit);
  if (sortBy) queryParams['sort_by'] = sortBy;
  const body = await canvaClient.request<ListFolderItemsResponse>({
    token,
    method: HttpMethod.GET,
    path: `/folders/${encodeURIComponent(folderId)}/items`,
    queryParams,
  });
  return { items: body?.items ?? [], continuation: body?.continuation };
}

async function collectFolderItems({ token, folderId, itemTypes }: { token: string; folderId: string; itemTypes: string }): Promise<{ items: FolderItemSummary[]; truncated: boolean }> {
  const collected: FolderItemSummary[] = [];
  let continuation: string | undefined;
  for (let page = 0; page < MAX_DROPDOWN_PAGES; page++) {
    const result = await listFolderPage({ token, folderId, itemTypes, continuation, limit: DROPDOWN_PAGE_SIZE });
    collected.push(...result.items);
    continuation = result.continuation;
    if (!continuation) {
      return { items: collected, truncated: false };
    }
  }
  return { items: collected, truncated: true };
}

async function fetchUserDesigns({ auth, query }: { auth: CanvaAuthValue; query?: string }): Promise<DropdownOptionList> {
  const options: Array<{ label: string; value: string }> = [];
  let continuation: string | undefined;
  for (let page = 0; page < MAX_DROPDOWN_PAGES; page++) {
    const queryParams: Record<string, string> = { limit: String(DROPDOWN_PAGE_SIZE) };
    const term = query?.trim();
    if (term) {
      queryParams['query'] = term;
    } else {
      queryParams['sort_by'] = 'modified_descending';
    }
    if (continuation) queryParams['continuation'] = continuation;
    const body = await canvaClient.request<ListDesignsResponse>({
      token: auth.access_token,
      method: HttpMethod.GET,
      path: '/designs',
      queryParams,
    });
    options.push(...(body?.items ?? []).map((design) => ({ label: design.title || `Design ${design.id}`, value: design.id })));
    continuation = body?.continuation;
    if (!continuation) {
      return { options, truncated: false };
    }
  }
  return { options, truncated: true };
}

async function fetchUserAssets({ auth }: { auth: CanvaAuthValue }): Promise<DropdownOptionList> {
  const seen = new Set<string>();
  const options: Array<{ label: string; value: string }> = [];
  let truncated = false;
  for (const folderId of ['root', 'uploads']) {
    const result = await collectFolderItems({ token: auth.access_token, folderId, itemTypes: 'image' });
    truncated = truncated || result.truncated;
    for (const item of result.items) {
      const id = item.image?.id;
      if (id && !seen.has(id)) {
        seen.add(id);
        options.push({ label: item.image?.name || `Asset ${id}`, value: id });
      }
    }
  }
  return { options, truncated };
}

async function fetchUserFolders({ auth }: { auth: CanvaAuthValue }): Promise<DropdownOptionList> {
  const options = [
    { label: 'Projects (top level)', value: 'root' },
    { label: 'Uploads', value: 'uploads' },
  ];
  let truncated = false;
  for (const parent of ['root', 'uploads']) {
    const result = await collectFolderItems({ token: auth.access_token, folderId: parent, itemTypes: 'folder' });
    truncated = truncated || result.truncated;
    for (const item of result.items) {
      if (item.folder?.id) {
        options.push({ label: item.folder.name || `Folder ${item.folder.id}`, value: item.folder.id });
      }
    }
  }
  return { options, truncated };
}

function dropdownState({ result }: { result: DropdownOptionList }) {
  return {
    disabled: false,
    options: result.options,
    placeholder: result.truncated ? 'Showing the first items only. Use a custom ID for others.' : undefined,
  };
}

function dropdownError({ error, what }: { error: unknown; what: string }) {
  const reason = error instanceof Error ? error.message : String(error);
  return {
    disabled: true,
    placeholder: `Could not load ${what}: ${reason}`.slice(0, 200),
    options: [],
  };
}

function flattenFolderItem(item: FolderItemSummary): FlatFolderItem {
  if (item.type === 'folder' && item.folder) {
    return {
      type: 'folder',
      id: item.folder.id,
      name: item.folder.name,
      created_at: item.folder.created_at,
      updated_at: item.folder.updated_at,
      thumbnail_url: item.folder.thumbnail?.url ?? null,
      edit_url: null,
      view_url: null,
      tags: [],
    };
  }
  if (item.type === 'design' && item.design) {
    return {
      type: 'design',
      id: item.design.id,
      name: item.design.title ?? null,
      created_at: item.design.created_at,
      updated_at: item.design.updated_at,
      thumbnail_url: item.design.thumbnail?.url ?? null,
      edit_url: item.design.urls?.edit_url ?? null,
      view_url: item.design.urls?.view_url ?? null,
      tags: [],
    };
  }
  if (item.type === 'image' && item.image) {
    return {
      type: 'image',
      id: item.image.id,
      name: item.image.name,
      created_at: item.image.created_at,
      updated_at: item.image.updated_at,
      thumbnail_url: item.image.thumbnail?.url ?? null,
      edit_url: null,
      view_url: null,
      tags: item.image.tags ?? [],
    };
  }
  const other = item.brand_template;
  return {
    type: item.type,
    id: other?.id ?? '',
    name: other?.title ?? null,
    created_at: other?.created_at ?? null,
    updated_at: other?.updated_at ?? null,
    thumbnail_url: other?.thumbnail?.url ?? null,
    edit_url: null,
    view_url: other?.view_url ?? null,
    tags: [],
  };
}

function parsePageNumbers(pages: unknown[] | undefined): number[] | undefined {
  if (!pages || pages.length === 0) {
    return undefined;
  }
  return pages.map((raw) => {
    const value = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isInteger(value) || value < 1) {
      throw new Error(`Page numbers must be whole numbers starting at 1. "${String(raw)}" is not valid.`);
    }
    return value;
  });
}

function base64Utf8(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

async function fetchJob<J extends { id: string; status: string }>({ token, kind, jobId }: { token: string; kind: JobKind; jobId: string }): Promise<J> {
  const body = await canvaClient.request<{ job: J }>({
    token,
    method: HttpMethod.GET,
    path: `${JOB_PATHS[kind].path}/${encodeURIComponent(jobId)}`,
  });
  return body.job;
}

async function settleJob<J extends { id: string; status: string; error?: JobError }>({
  token,
  kind,
  initial,
  timeoutSeconds,
  failOnTimeout,
  statusAction,
}: {
  statusAction?: string;
  token: string;
  kind: JobKind;
  initial: J;
  timeoutSeconds: number;
  failOnTimeout: boolean;
}): Promise<J> {
  const { job, timedOut } = await canvaClient.waitForJob<J>({
    initial,
    timeoutSeconds,
    jobLabel: JOB_PATHS[kind].label,
    statusAction,
    fetchJob: (jobId) => fetchJob<J>({ token, kind, jobId }),
  });
  if (job.status === 'failed') {
    throw canvaClient.jobFailureError({ jobLabel: JOB_PATHS[kind].label, jobId: job.id, error: job.error });
  }
  if (timedOut && failOnTimeout) {
    throw canvaClient.jobTimeoutError({ jobLabel: JOB_PATHS[kind].label, jobId: job.id, timeoutSeconds });
  }
  return job;
}

function clampWaitSeconds(value: number | undefined): number {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return DEFAULT_WAIT_SECONDS;
  }
  return Math.min(Math.max(Math.round(value), 5), MAX_WAIT_SECONDS);
}

function flattenJob({ kind, job }: { kind: JobKind; job: AnyJob }): FlatJob {
  return {
    job_type: kind,
    job_id: job.id,
    status: job.status,
    urls: 'urls' in job && job.urls ? job.urls : [],
    asset: 'asset' in job && job.asset ? job.asset : null,
    designs: 'result' in job && job.result ? job.result.designs : [],
    error_code: job.error?.code ?? null,
    error_message: job.error?.message ?? null,
  };
}

function designDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown({
    auth: canvaAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    refreshOnSearch: true,
    options: async ({ auth }, { searchValue }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Canva account first', options: [] };
      }
      try {
        return dropdownState({ result: await fetchUserDesigns({ auth, query: searchValue }) });
      } catch (error) {
        return dropdownError({ error, what: 'designs' });
      }
    },
  });
}

function assetDropdown({ displayName, description, required }: { displayName: string; description: string; required: boolean }) {
  return Property.Dropdown({
    auth: canvaAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Canva account first', options: [] };
      }
      try {
        return dropdownState({ result: await fetchUserAssets({ auth }) });
      } catch (error) {
        return dropdownError({ error, what: 'assets' });
      }
    },
  });
}

function folderDropdown({ displayName, description }: { displayName: string; description: string }) {
  return Property.Dropdown({
    auth: canvaAuth,
    displayName,
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, placeholder: 'Connect your Canva account first', options: [] };
      }
      try {
        return dropdownState({ result: await fetchUserFolders({ auth }) });
      } catch (error) {
        return dropdownError({ error, what: 'folders' });
      }
    },
  });
}

function waitProps() {
  return {
    waitForCompletion: Property.Checkbox({
      displayName: 'Wait for Completion',
      description: 'Wait until Canva finishes the job and return the result. Turn off to return the job ID right away and check it later with Get Job Status.',
      required: false,
      defaultValue: true,
    }),
    maxWaitSeconds: Property.Number({
      displayName: 'Maximum Wait (seconds)',
      description: `How long to wait for Canva before failing with the job ID (5-${MAX_WAIT_SECONDS}, default ${DEFAULT_WAIT_SECONDS}).`,
      required: false,
      defaultValue: DEFAULT_WAIT_SECONDS,
    }),
  };
}

export const canvaProps = { designDropdown, assetDropdown, folderDropdown, waitProps };

export const canvaCommon = {
  baseUrl: canvaClient.baseUrl,
  fetchUserDesigns,
  fetchUserAssets,
  fetchUserFolders,
  listFolderPage,
  flattenFolderItem,
  dropdownState,
  dropdownError,
  parsePageNumbers,
  base64Utf8,
  fetchJob,
  settleJob,
  clampWaitSeconds,
  flattenJob,
};

export { canvaAuth };

export const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
  { value: 'gif', label: 'GIF' },
  { value: 'pptx', label: 'PowerPoint (PPTX)' },
  { value: 'mp4', label: 'MP4 Video' },
];

export const PDF_SIZES = [
  { value: 'a4', label: 'A4' },
  { value: 'a3', label: 'A3' },
  { value: 'letter', label: 'Letter' },
  { value: 'legal', label: 'Legal' },
];

export const MP4_QUALITIES = [
  { value: 'horizontal_480p', label: 'Horizontal 480p' },
  { value: 'horizontal_720p', label: 'Horizontal 720p' },
  { value: 'horizontal_1080p', label: 'Horizontal 1080p' },
  { value: 'horizontal_4k', label: 'Horizontal 4K' },
  { value: 'vertical_480p', label: 'Vertical 480p' },
  { value: 'vertical_720p', label: 'Vertical 720p' },
  { value: 'vertical_1080p', label: 'Vertical 1080p' },
  { value: 'vertical_4k', label: 'Vertical 4K' },
];

export const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'heic', 'gif', 'tiff', 'webp'];
export const SUPPORTED_VIDEO_FORMATS = ['m4v', 'mkv', 'mp4', 'mpeg', 'mov', 'webm'];

export const SUPPORTED_IMPORT_FORMATS = [
  { ext: 'ai', mime: 'application/illustrator', name: 'Adobe Illustrator' },
  { ext: 'psd', mime: 'image/vnd.adobe.photoshop', name: 'Adobe Photoshop' },
  { ext: 'key', mime: 'application/vnd.apple.keynote', name: 'Apple Keynote' },
  { ext: 'numbers', mime: 'application/vnd.apple.numbers', name: 'Apple Numbers' },
  { ext: 'pages', mime: 'application/vnd.apple.pages', name: 'Apple Pages' },
  { ext: 'xls', mime: 'application/vnd.ms-excel', name: 'Microsoft Excel (pre 2007)' },
  { ext: 'xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', name: 'Microsoft Excel' },
  { ext: 'ppt', mime: 'application/vnd.ms-powerpoint', name: 'Microsoft PowerPoint (pre 2007)' },
  { ext: 'pptx', mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', name: 'Microsoft PowerPoint' },
  { ext: 'doc', mime: 'application/msword', name: 'Microsoft Word (pre 2007)' },
  { ext: 'docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', name: 'Microsoft Word' },
  { ext: 'odg', mime: 'application/vnd.oasis.opendocument.graphics', name: 'OpenOffice Draw' },
  { ext: 'odp', mime: 'application/vnd.oasis.opendocument.presentation', name: 'OpenOffice Presentation' },
  { ext: 'ods', mime: 'application/vnd.oasis.opendocument.spreadsheet', name: 'OpenOffice Sheets' },
  { ext: 'odt', mime: 'application/vnd.oasis.opendocument.text', name: 'OpenOffice Text' },
  { ext: 'pdf', mime: 'application/pdf', name: 'PDF' },
];

export const JOB_PATHS: Record<JobKind, { path: string; label: string }> = {
  export: { path: '/exports', label: 'export' },
  asset_upload: { path: '/asset-uploads', label: 'asset upload' },
  url_asset_upload: { path: '/url-asset-uploads', label: 'asset upload from URL' },
  import: { path: '/imports', label: 'design import' },
  url_import: { path: '/url-imports', label: 'design import from URL' },
};

export const MAX_IMAGE_SIZE_MB = 50;
export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_ASSET_NAME_LENGTH = 50;
export const MAX_DESIGN_TITLE_LENGTH = 50;
export const MIN_EXPORT_DIMENSION = 40;
export const MAX_EXPORT_DIMENSION = 25000;
export const DEFAULT_WAIT_SECONDS = 120;
export const MAX_WAIT_SECONDS = 300;
export const AI_WAIT_SECONDS = 25;

export type CanvaAuthValue = AppConnectionValueForAuthProperty<typeof canvaAuth>;

export type DropdownOptionList = { options: Array<{ label: string; value: string }>; truncated: boolean };

export type Thumbnail = { width: number; height: number; url: string };

export type DesignLinks = { edit_url: string; view_url: string };

export type Design = {
  id: string;
  title?: string;
  owner?: { user_id: string; team_id: string };
  urls: DesignLinks;
  created_at: number;
  updated_at: number;
  thumbnail?: Thumbnail;
  page_count?: number;
  design_types?: string[];
};

export type CanvaDesignResponse = { design: Design };

export type ListDesignsResponse = { items: Design[]; continuation?: string };

export type Folder = { id: string; name: string; created_at: number; updated_at: number; thumbnail?: Thumbnail };

export type FolderResponse = { folder: Folder };

export type AssetSummary = {
  type: 'image' | 'video';
  id: string;
  name: string;
  tags: string[];
  created_at: number;
  updated_at: number;
  thumbnail?: Thumbnail;
};

export type FolderItemSummary = {
  type: string;
  folder?: Folder;
  design?: Design;
  image?: AssetSummary;
  brand_template?: { id: string; title?: string; view_url?: string; created_at?: number; updated_at?: number; thumbnail?: Thumbnail };
};

export type ListFolderItemsResponse = { items: FolderItemSummary[]; continuation?: string };

export type FlatFolderItem = {
  type: string;
  id: string;
  name: string | null;
  created_at: number | null;
  updated_at: number | null;
  thumbnail_url: string | null;
  edit_url: string | null;
  view_url: string | null;
  tags: string[];
};

export type Asset = AssetSummary & {
  owner?: { user_id: string; team_id: string };
  metadata?: { type: string; width?: number; height?: number; duration?: number; smart_tags?: string[] };
  import_status?: { state: 'failed' | 'in_progress' | 'success'; error?: { code: string; message: string } };
};

export type AssetResponse = { asset: Asset };

export type JobError = { code: string; message: string };

export type AssetUploadJob = { id: string; status: JobStatus; error?: JobError; asset?: Asset };

export type DesignImportJob = { id: string; status: JobStatus; result?: { designs: Design[] }; error?: JobError };

export type ExportJob = { id: string; status: JobStatus; urls?: string[]; error?: JobError };

export type JobStatus = 'failed' | 'in_progress' | 'success';

export type ExportFormat = {
  type: string;
  quality?: number | string;
  pages?: number[];
  export_quality?: string;
  size?: string;
  height?: number;
  width?: number;
  lossless?: boolean;
  transparent_background?: boolean;
  as_single_image?: boolean;
};

export type JobKind = 'export' | 'asset_upload' | 'url_asset_upload' | 'import' | 'url_import';

export type AnyJob = ExportJob | AssetUploadJob | DesignImportJob;

export type FlatJob = {
  job_type: JobKind;
  job_id: string;
  status: string;
  urls: string[];
  asset: Asset | null;
  designs: Design[];
  error_code: string | null;
  error_message: string | null;
};
