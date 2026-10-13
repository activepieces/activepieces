import { CONVERTKIT_API_URL } from './constants';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const KIT_ORIGIN = new URL(CONVERTKIT_API_URL).origin;
const KIT_PATH = new URL(CONVERTKIT_API_URL).pathname;

const resolveTarget = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const relative = url.startsWith('/') ? url.slice(1) : url;
  return `${CONVERTKIT_API_URL}/${relative}`;
};

const hasDotSegment = (url: string): boolean => {
  const path = url.split(/[?#]/)[0] ?? '';
  return path
    .split('/')
    .some((segment) => {
      const decoded = segment.replace(/%2e/gi, '.');
      return decoded === '.' || decoded === '..';
    });
};

const isKitTarget = (url: string): boolean => {
  if (url.startsWith('//') || url.includes('\\') || hasDotSegment(url)) {
    return false;
  }
  let target: URL;
  try {
    target = new URL(resolveTarget(url));
  } catch {
    return false;
  }
  if (target.origin !== KIT_ORIGIN || target.username !== '' || target.password !== '') {
    return false;
  }
  return target.pathname === KIT_PATH || target.pathname.startsWith(`${KIT_PATH}/`);
};

export const assertKitUrl = (propsValue: unknown): void => {
  const urlProp = isRecord(propsValue) ? propsValue['url'] : undefined;
  const url = isRecord(urlProp) ? urlProp['url'] : undefined;
  if (typeof url !== 'string') {
    return;
  }
  if (!isKitTarget(url.trim())) {
    throw new Error(
      `Custom API Call only sends your Kit API Secret to ${CONVERTKIT_API_URL}. Use a path relative to it, e.g. /subscribers.`
    );
  }
};
