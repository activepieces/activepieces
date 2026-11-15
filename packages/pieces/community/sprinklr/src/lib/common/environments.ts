import { sprinklrEndpoints } from './endpoints';

const API_HOST = 'https://api3.sprinklr.com';

const SEGMENTS = [
  'prod0',
  'prod2',
  'prod3',
  'prod4',
  'prod5',
  'prod6',
  'prod8',
  'prod11',
  'prod12',
  'prod15',
  'prod16',
  'prod17',
  'prod18',
  'prod19',
  'prod21',
  'prod25',
];

const OPTIONS: SprinklrEnvironmentOption[] = [
  { label: 'Production (app.sprinklr.com)', value: API_HOST },
  { label: 'Production (alternate URL with /prod)', value: `${API_HOST}/prod` },
  ...SEGMENTS.map((segment) => ({ label: segment, value: `${API_HOST}/${segment}` })),
];

function trimBase(base: string): string {
  return base.trim().replace(/\/+$/, '');
}

function apiBaseUrl(base: string): string {
  return `${trimBase(base)}/api/${sprinklrEndpoints.API_VERSION}`;
}

function customApiBaseUrl(base: string): string {
  return `${trimBase(base)}/api`;
}

export const sprinklrEnvironments = {
  API_HOST,
  OPTIONS,
  DEFAULT_CALLBACK_URL: 'https://cloud.activepieces.com/redirect',
  trimBase,
  apiBaseUrl,
  customApiBaseUrl,
};

export type SprinklrEnvironmentOption = {
  label: string;
  value: string;
};
