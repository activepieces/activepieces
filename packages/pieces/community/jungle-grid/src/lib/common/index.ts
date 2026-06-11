import { jungleGridClient } from './client';
import { jungleGridProps } from './props';

const defaultBaseUrl = 'https://api.junglegrid.dev';

const endpoints = {
  estimateJob: '/v1/mcp/jobs/estimate',
  submitJob: '/v1/mcp/jobs',
  listJobs: '/v1/mcp/jobs',
  jobInputs: '/v1/job-inputs',
  jobInputComplete: (inputId: string) => `/v1/job-inputs/${encodeURIComponent(inputId)}/complete`,
  jobStatus: (jobId: string) => `/v1/mcp/jobs/${encodeURIComponent(jobId)}`,
  jobEvents: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/events`,
  jobRuntime: (jobId: string) => `/v1/jobs/${encodeURIComponent(jobId)}/runtime`,
  jobLogs: (jobId: string) => `/v1/mcp/jobs/${encodeURIComponent(jobId)}/logs`,
  artifacts: (jobId: string) => `/v1/mcp/jobs/${encodeURIComponent(jobId)}/artifacts`,
  cancelJob: (jobId: string) => `/v1/mcp/jobs/${encodeURIComponent(jobId)}/cancel`,
  artifactDownloadUrl: (jobId: string, artifactId: string) =>
    `/v1/mcp/jobs/${encodeURIComponent(jobId)}/artifacts/${encodeURIComponent(artifactId)}/download`,
};

export const jungleGridCommon = {
  ...jungleGridClient,
  ...jungleGridProps,
  defaultBaseUrl,
  endpoints,
};

export { JungleGridApiError } from './client';
