/**
 * AP frontend: which deploy we're in, and the otom8 marketing/auth site URL.
 * CI bakes VITE_DEPLOY_ENV + VITE_OTOM8_SITE_URL into the bundle.
 * When you run that same image on localhost, we still treat the shell as
 * "local" so redirects go to http://localhost:3001 (hostname wins over build args).
 */

export type DeployEnv = 'local' | 'stg' | 'prod';

const buildDeployEnv = import.meta.env.VITE_DEPLOY_ENV as string | undefined;
const buildSiteUrlOverride = import.meta.env.VITE_OTOM8_SITE_URL as
  | string
  | undefined;

function resolveDeployEnv(): DeployEnv {
  if (
    typeof window !== 'undefined' &&
    window.location.hostname === 'localhost'
  ) {
    return 'local';
  }
  if (
    buildDeployEnv === 'local' ||
    buildDeployEnv === 'stg' ||
    buildDeployEnv === 'prod'
  ) {
    return buildDeployEnv;
  }
  return 'prod';
}

export const DEPLOY_ENV: DeployEnv = resolveDeployEnv();

export const IS_LOCAL = DEPLOY_ENV === 'local';
export const IS_PROD = DEPLOY_ENV === 'prod';
export const IS_STG = DEPLOY_ENV === 'stg';

function resolveOtom8SiteUrl(): string {
  if (DEPLOY_ENV === 'local') {
    return 'http://localhost:3001';
  }
  if (buildSiteUrlOverride) {
    return buildSiteUrlOverride.replace(/\/$/, '');
  }
  return 'https://otom8.us';
}

export const OTOM8_SITE_URL = resolveOtom8SiteUrl();
