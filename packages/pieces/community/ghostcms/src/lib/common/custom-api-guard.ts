import { GhostAuthValue, ghostClient, ghostCommon } from './client';

const ABSOLUTE = /^[a-z][a-z0-9+.-]*:/i;

export const assertGhostUrl = ({ auth, propsValue }: { auth: GhostAuthValue; propsValue: unknown }): void => {
  const urlProp = ghostCommon.isRecord(propsValue) ? propsValue['url'] : undefined;
  const url = ghostCommon.isRecord(urlProp) ? urlProp['url'] : undefined;
  if (typeof url !== 'string') {
    return;
  }
  const target = url.trim();
  const base = ghostClient.adminUrl(auth);
  const refuse = (): never => {
    throw new Error(
      `Custom API Call only sends your Ghost Admin API key to ${base}. Use a path relative to it, e.g. /posts/.`
    );
  };
  if (ABSOLUTE.test(target) || target.startsWith('//') || target.startsWith('\\')) {
    if (!(target === base || target.startsWith(`${base}/`) || target.startsWith(`${base}?`))) {
      refuse();
    }
  }
  const path = target.split(/[?#]/)[0];
  if (path.split(/[/\\]/).some((segment) => decodeSegment(segment) === '..')) {
    refuse();
  }
};

const decodeSegment = (segment: string): string => {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
};
