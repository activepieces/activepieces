import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpMessageBody,
} from '@activepieces/pieces-common';
import { ApFile, Property } from '@activepieces/pieces-framework';

const BASE_URL = 'https://api.magichour.ai/v1';
const POLL_INTERVAL_MS = 5000;
const DEFAULT_MAX_WAIT_SECONDS = 600;
const TERMINAL_STATUSES = ['complete', 'error', 'canceled'];

const VIDEO_MODELS: VideoModelSpec[] = [
  {
    id: 'wan-2.2',
    label: 'WAN 2.2',
    creditsPerSecond: 24,
    durations: '3-10, 15',
    free: true,
  },
  {
    id: 'ltx-2.3',
    label: 'LTX 2.3',
    creditsPerSecond: 24,
    durations: '1-10, 15, 20, 25, 30',
    free: true,
  },
  {
    id: 'minimax-h3',
    label: 'MiniMax H3',
    creditsPerSecond: 24,
    durations: '1-10, 15, 20, 25, 30',
    free: true,
    maxResolution: '1080p',
  },
  {
    id: 'seedance-1.5',
    label: 'Seedance 1.5',
    creditsPerSecond: 30,
    durations: '4-12',
  },
  {
    id: 'kling-2.6',
    label: 'Kling 2.6',
    creditsPerSecond: 36,
    durations: '5, 10',
  },
  {
    id: 'kling-3.0',
    label: 'Kling 3.0',
    creditsPerSecond: 48,
    durations: '3-15',
  },
  {
    id: 'veo3.1-lite',
    label: 'Veo 3.1 Lite',
    creditsPerSecond: 48,
    durations: '4, 6, 8, 16, 24, 32, 40, 48, 56',
  },
  {
    id: 'veo3.1',
    label: 'Veo 3.1',
    creditsPerSecond: 96,
    durations: '4, 6, 8, 16, 24, 32, 40, 48, 56',
  },
  {
    id: 'veo3.1-audio',
    label: 'Veo 3.1 with audio',
    creditsPerSecond: 96,
    durations: '4, 6, 8, 16, 24, 32, 40, 48, 56',
  },
  {
    id: 'seedance-2.0-mini',
    label: 'Seedance 2.0 Mini',
    creditsPerSecond: 96,
    durations: '4-15',
    maxResolution: '720p',
  },
  {
    id: 'sora-2',
    label: 'Sora 2',
    creditsPerSecond: 120,
    durations: '4, 8, 12, 24, 36, 48, 60',
    maxResolution: '720p',
  },
  {
    id: 'seedance-2.0',
    label: 'Seedance 2.0',
    creditsPerSecond: 144,
    durations: '4-15',
    maxResolution: '720p',
  },
  {
    id: 'seedance-2.5',
    label: 'Seedance 2.5',
    creditsPerSecond: 288,
    durations: '4-30',
    maxResolution: '720p',
  },
];

const IMAGE_MODELS = [
  { id: 'default', label: 'Default (Magic Hour picks the best model)' },
  { id: 'gpt-image-2', label: 'GPT Image 2' },
  { id: 'nano-banana-pro', label: 'Nano Banana Pro' },
  { id: 'seedream-5-pro', label: 'Seedream 5 Pro' },
  { id: 'flux-2-klein', label: 'Flux 2 Klein' },
  { id: 'z-image-turbo', label: 'Z-Image Turbo' },
  { id: 'qwen-edit', label: 'Qwen Edit' },
];

const EXTENSION_BY_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
};

async function apiCall<T>({
  apiKey,
  method,
  path,
  body,
}: ApiCallParams): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token: apiKey },
    body,
  });
  return response.body;
}

async function getVideoProject({
  apiKey,
  projectId,
}: ProjectParams): Promise<ProjectResponse> {
  return apiCall<ProjectResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: `/video-projects/${projectId}`,
  });
}

async function getImageProject({
  apiKey,
  projectId,
}: ProjectParams): Promise<ProjectResponse> {
  return apiCall<ProjectResponse>({
    apiKey,
    method: HttpMethod.GET,
    path: `/image-projects/${projectId}`,
  });
}

async function waitForProject({
  apiKey,
  projectId,
  kind,
  maxWaitSeconds,
}: WaitForProjectParams): Promise<ProjectResponse> {
  const fetchProject = kind === 'video' ? getVideoProject : getImageProject;
  const deadline =
    Date.now() + (maxWaitSeconds ?? DEFAULT_MAX_WAIT_SECONDS) * 1000;
  let project = await fetchProject({ apiKey, projectId });
  while (!TERMINAL_STATUSES.includes(project.status) && Date.now() < deadline) {
    await sleep(POLL_INTERVAL_MS);
    project = await fetchProject({ apiKey, projectId });
  }
  if (project.status === 'error' || project.status === 'canceled') {
    throw new Error(
      `Magic Hour ${kind} project ${projectId} ${
        project.status
      }: ${describeError(
        project.error
      )}. Credits for failed jobs are refunded automatically.`
    );
  }
  if (project.status !== 'complete') {
    throw new Error(
      `Magic Hour ${kind} project ${projectId} is still "${
        project.status
      }" after ${
        maxWaitSeconds ?? DEFAULT_MAX_WAIT_SECONDS
      } seconds. Use the "Get Project Status" action later with this project ID to fetch the result.`
    );
  }
  return project;
}

async function uploadFile({ apiKey, file }: UploadFileParams): Promise<string> {
  const extension = (
    file.extension ??
    file.filename.split('.').pop() ??
    'png'
  ).toLowerCase();
  const uploadUrls = await apiCall<UploadUrlsResponse>({
    apiKey,
    method: HttpMethod.POST,
    path: '/files/upload-urls',
    body: { items: [{ extension, type: 'image' }] },
  });
  const item = uploadUrls.items[0];
  if (!item) {
    throw new Error('Magic Hour did not return an upload URL.');
  }
  await httpClient.sendRequest({
    method: HttpMethod.PUT,
    url: item.upload_url,
    headers: {
      'Content-Type':
        EXTENSION_BY_MIME[extension] ?? 'application/octet-stream',
    },
    body: file.data,
  });
  return item.file_path;
}

function toVideoOutput({ project, model }: ToOutputParams): VideoOutput {
  const download = project.downloads?.[0];
  return {
    project_id: project.id,
    status: project.status,
    model,
    video_url: download?.url ?? null,
    download_expires_at: download?.expires_at ?? null,
    credits_charged: project.credits_charged ?? null,
    width: project.width ?? null,
    height: project.height ?? null,
    fps: project.fps ?? null,
    error: project.error ? describeError(project.error) : null,
  };
}

function toImageOutput({ project, model }: ToOutputParams): ImageOutput {
  return {
    project_id: project.id,
    status: project.status,
    model,
    image_urls: (project.downloads ?? []).map((download) => download.url),
    download_expires_at: project.downloads?.[0]?.expires_at ?? null,
    credits_charged: project.credits_charged ?? null,
    error: project.error ? describeError(project.error) : null,
  };
}

function describeError(error: unknown): string {
  if (error == null) return 'unknown error';
  if (typeof error === 'string') return error;
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return JSON.stringify(error);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function videoModelLabel(model: VideoModelSpec): string {
  const tier = model.free
    ? 'FREE tier'
    : `${model.creditsPerSecond} credits/sec`;
  const cap = model.maxResolution ? `, max ${model.maxResolution}` : '';
  return `${model.label} (${tier}, ${model.durations}s${cap})`;
}

const videoModelProp = Property.StaticDropdown({
  displayName: 'Model',
  description:
    'Video model. FREE tier models (WAN 2.2, LTX 2.3, MiniMax H3) cost 24 credits/sec and work on the free plan; Kling, Veo, Sora and Seedance cost more and need a paid plan. Each model only accepts the clip lengths listed in its label.',
  required: true,
  defaultValue: 'wan-2.2',
  options: {
    options: VIDEO_MODELS.map((model) => ({
      label: videoModelLabel(model),
      value: model.id,
    })),
  },
});

const imageModelProp = Property.StaticDropdown({
  displayName: 'Model',
  description:
    'Image model. "Default" lets Magic Hour pick the best available model.',
  required: true,
  defaultValue: 'default',
  options: {
    options: IMAGE_MODELS.map((model) => ({
      label: model.label,
      value: model.id,
    })),
  },
});

const durationProp = Property.Number({
  displayName: 'Duration (seconds)',
  description:
    'Clip length in seconds. Must be one of the lengths the selected model supports (shown in the model label). Cost = credits/sec x duration, e.g. WAN 2.2 at 5s = 120 credits.',
  required: true,
  defaultValue: 5,
});

const resolutionProp = Property.StaticDropdown({
  displayName: 'Resolution',
  description:
    'Higher resolutions cost more credits. Sora 2 and Seedance 2.x are capped at 720p.',
  required: true,
  defaultValue: '480p',
  options: {
    options: [
      { label: '480p', value: '480p' },
      { label: '720p', value: '720p' },
      { label: '1080p', value: '1080p' },
    ],
  },
});

const aspectRatioProp = Property.StaticDropdown({
  displayName: 'Aspect Ratio',
  required: false,
  defaultValue: '16:9',
  options: {
    options: [
      { label: 'Landscape (16:9)', value: '16:9' },
      { label: 'Portrait (9:16)', value: '9:16' },
      { label: 'Square (1:1)', value: '1:1' },
    ],
  },
});

const waitForCompletionProp = Property.Checkbox({
  displayName: 'Wait for Completion',
  description:
    'Poll Magic Hour every 5 seconds until the render finishes and return the download URL. Turn off to return the project ID immediately and fetch the result later with "Get Project Status".',
  required: false,
  defaultValue: true,
});

const maxWaitSecondsProp = Property.Number({
  displayName: 'Max Wait (seconds)',
  description:
    'Give up waiting after this many seconds (default 600). Only used when "Wait for Completion" is on.',
  required: false,
  defaultValue: DEFAULT_MAX_WAIT_SECONDS,
});

export const magicHourCommon = {
  baseUrl: BASE_URL,
  apiCall,
  getVideoProject,
  getImageProject,
  waitForProject,
  uploadFile,
  toVideoOutput,
  toImageOutput,
  props: {
    videoModel: videoModelProp,
    imageModel: imageModelProp,
    duration: durationProp,
    resolution: resolutionProp,
    aspectRatio: aspectRatioProp,
    waitForCompletion: waitForCompletionProp,
    maxWaitSeconds: maxWaitSecondsProp,
  },
};

type VideoModelSpec = {
  id: string;
  label: string;
  creditsPerSecond: number;
  durations: string;
  free?: boolean;
  maxResolution?: string;
};

type ApiCallParams = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: HttpMessageBody;
};

type ProjectParams = {
  apiKey: string;
  projectId: string;
};

type WaitForProjectParams = ProjectParams & {
  kind: ProjectKind;
  maxWaitSeconds?: number;
};

type UploadFileParams = {
  apiKey: string;
  file: ApFile;
};

type ToOutputParams = {
  project: ProjectResponse;
  model: string | null;
};

type UploadUrlsResponse = {
  items: { upload_url: string; file_path: string }[];
};

export type ProjectKind = 'video' | 'image';

export type SubmitResponse = {
  id: string;
  credits_charged?: number;
};

export type ProjectResponse = {
  id: string;
  status: string;
  error?: unknown;
  downloads?: { url: string; expires_at?: string }[];
  credits_charged?: number;
  width?: number;
  height?: number;
  fps?: number;
};

export type VideoOutput = {
  project_id: string;
  status: string;
  model: string | null;
  video_url: string | null;
  download_expires_at: string | null;
  credits_charged: number | null;
  width: number | null;
  height: number | null;
  fps: number | null;
  error: string | null;
};

export type ImageOutput = {
  project_id: string;
  status: string;
  model: string | null;
  image_urls: string[];
  download_expires_at: string | null;
  credits_charged: number | null;
  error: string | null;
};
