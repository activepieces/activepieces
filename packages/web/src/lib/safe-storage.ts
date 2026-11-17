import { tryCatchSync } from '@activepieces/core-utils';

import { ApStorage } from '@/lib/ap-browser-storage';

function read({ area, key }: StorageKey): string | null {
  return tryCatchSync(() => storageFor(area).getItem(key)).data ?? null;
}

function write({ area, key, value }: StorageKey & { value: string }): void {
  tryCatchSync(() => storageFor(area).setItem(key, value));
}

function remove({ area, key }: StorageKey): void {
  tryCatchSync(() => storageFor(area).removeItem(key));
}

function readJson(target: StorageKey): unknown {
  const raw = read(target);
  if (raw === null) return null;
  return tryCatchSync<unknown>(() => JSON.parse(raw)).data ?? null;
}

function writeJson({ value, ...target }: StorageKey & { value: unknown }) {
  write({ ...target, value: JSON.stringify(value) });
}

function storageFor(area: StorageArea): Storage {
  return area === 'session' ? window.sessionStorage : ApStorage.getInstance();
}

export const safeStorage = {
  read,
  write,
  remove,
  readJson,
  writeJson,
};

type StorageArea = 'local' | 'session';
type StorageKey = { area: StorageArea; key: string };
