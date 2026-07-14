import { jungleGridClient } from './client';
import { jungleGridProps } from './props';

const defaultBaseUrl = 'https://api.junglegrid.dev';

const endpoints = {
  estimateJob: '/v1/jobs/estimate',
  submitJob: '/v1/jobs',
  listJobs: '/v1/jobs',
  jobStatus: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}`,
  jobRuntime: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/runtime`,
  jobLogs: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/logs`,
  artifacts: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/artifacts`,
  cancelJob: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/cancel`,
  artifactDownloadUrl: (jobId: string, artifactId: string) =>
    `/v1/jobs/${encodeURIComponent(jobId)}/artifacts/${encodeURIComponent(artifactId)}/download`,
};

export const jungleGridCommon = {
  ...jungleGridClient,
  ...jungleGridProps,
  defaultBaseUrl,
  endpoints,
};

export { JungleGridApiError } from './client';
