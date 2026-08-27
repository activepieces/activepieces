import { isEmpty, isNil, tryCatchSync } from '@activepieces/core-utils';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const useStashTrialKeyFromUrl = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const licenseKey = searchParams.get(TRIAL_KEY_QUERY_PARAM)?.trim();
    if (isNil(licenseKey) || isEmpty(licenseKey)) {
      return;
    }
    stash(licenseKey);
    const remaining = new URLSearchParams(searchParams);
    remaining.delete(TRIAL_KEY_QUERY_PARAM);
    setSearchParams(remaining, { replace: true });
  }, [searchParams, setSearchParams]);
};

function read(): string | undefined {
  const { data } = tryCatchSync(() =>
    window.sessionStorage.getItem(STORAGE_KEY),
  );
  return isNil(data) || isEmpty(data) ? undefined : data;
}

function stash(licenseKey: string): void {
  tryCatchSync(() => window.sessionStorage.setItem(STORAGE_KEY, licenseKey));
}

function clear(): void {
  tryCatchSync(() => window.sessionStorage.removeItem(STORAGE_KEY));
}

function linkFor(licenseKey: string): string {
  return `${
    window.location.origin
  }/sign-in?${TRIAL_KEY_QUERY_PARAM}=${encodeURIComponent(licenseKey)}`;
}

export const trialKeyStash = {
  read,
  clear,
  linkFor,
};

const STORAGE_KEY = 'ap-pending-trial-key';
const TRIAL_KEY_QUERY_PARAM = 'licenseKey';
