import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlParam<T extends string>({
  key,
  fallback,
  allowed,
}: {
  key: string;
  fallback: T;
  allowed: readonly T[];
}): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = allowed.find((option) => option === raw) ?? fallback;
  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => writeParam({ prev, key, value: next, fallback }),
        { replace: true },
      );
    },
    [setSearchParams, key, fallback],
  );
  return [value, setValue];
}

export function writeParam({
  prev,
  key,
  value,
  fallback,
}: {
  prev: URLSearchParams;
  key: string;
  value: string;
  fallback?: string;
}): URLSearchParams {
  const params = new URLSearchParams(prev);
  if (value.trim().length === 0 || value === fallback) {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  params.delete(CURSOR_PARAM);
  return params;
}

const CURSOR_PARAM = 'cursor';
