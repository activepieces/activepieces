import { tryCatchSync } from '@activepieces/core-utils';

function read({ area, key }: StorageKey): string | null {
  return tryCatchSync(() => storageFor(area).getItem(key)).data ?? null;
}

function write({ area, key, value }: StorageKey & { value: string }): void {
  tryCatchSync(() => storageFor(area).setItem(key, value));
}

function readJson(target: StorageKey): unknown {
  const raw = read(target);
  if (raw === null) return null;
  return tryCatchSync<unknown>(() => JSON.parse(raw)).data ?? null;
}

function writeJson({ value, ...target }: StorageKey & { value: unknown }) {
  write({ ...target, value: JSON.stringify(value) });
}

function readFlag(target: StorageKey): boolean {
  return read(target) === 'true';
}

function writeFlag({ value, ...target }: StorageKey & { value: boolean }) {
  write({ ...target, value: String(value) });
}

function storageFor(area: StorageArea): Storage {
  return area === 'session' ? window.sessionStorage : window.localStorage;
}

export const safeStorage = {
  read,
  write,
  readJson,
  writeJson,
  readFlag,
  writeFlag,
};

type StorageArea = 'local' | 'session';
type StorageKey = { area: StorageArea; key: string };
