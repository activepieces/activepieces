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
    stashTrialKey(licenseKey);
    const remaining = new URLSearchParams(searchParams);
    remaining.delete(TRIAL_KEY_QUERY_PARAM);
    setSearchParams(remaining, { replace: true });
  }, [searchParams, setSearchParams]);
};

export function readStashedTrialKey(): string | undefined {
  const { data } = tryCatchSync(() =>
    window.sessionStorage.getItem(STORAGE_KEY),
  );
  return isNil(data) || isEmpty(data) ? undefined : data;
}

function stashTrialKey(licenseKey: string): void {
  tryCatchSync(() => window.sessionStorage.setItem(STORAGE_KEY, licenseKey));
}

export function clearStashedTrialKey(): void {
  tryCatchSync(() => window.sessionStorage.removeItem(STORAGE_KEY));
}

const STORAGE_KEY = 'ap-pending-trial-key';
const TRIAL_KEY_QUERY_PARAM = 'licenseKey';
