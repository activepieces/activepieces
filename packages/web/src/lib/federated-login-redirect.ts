import { isNil, tryCatchSync } from '@activepieces/core-utils';

function save(from: string | null | undefined) {
  if (!isSameSitePath(from)) {
    tryCatchSync(() => sessionStorage.removeItem(STORAGE_KEY));
    return;
  }
  tryCatchSync(() => sessionStorage.setItem(STORAGE_KEY, from));
}

function consume(): string | null {
  const { data } = tryCatchSync(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    return stored;
  });
  return isSameSitePath(data) ? data : null;
}

function isSameSitePath(path: string | null | undefined): path is string {
  if (isNil(path)) {
    return false;
  }
  return (
    path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
  );
}

const STORAGE_KEY = 'federatedLoginRedirect';

export const federatedLoginRedirect = { save, consume };
