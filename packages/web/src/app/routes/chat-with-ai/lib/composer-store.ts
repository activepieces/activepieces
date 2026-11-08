import { isNil } from '@activepieces/core-utils';
import { create } from 'zustand';

const usePendingFills = create<{ fills: Record<string, ComposerFill> }>(() => ({
  fills: {},
}));

function fill({
  key,
  text,
  files = [],
  mode = 'replace',
}: {
  key: string;
  text: string;
  files?: File[];
  mode?: ComposerFillMode;
}): void {
  usePendingFills.setState((state) => ({
    fills: { ...state.fills, [key]: { text, files, mode } },
  }));
}

function take(key: string): ComposerFill | null {
  const pending = usePendingFills.getState().fills[key];
  if (isNil(pending)) return null;
  usePendingFills.setState((state) => ({
    fills: Object.fromEntries(
      Object.entries(state.fills).filter(([k]) => k !== key),
    ),
  }));
  return pending;
}

function usePendingFill(key: string | undefined): ComposerFill | null {
  return usePendingFills((state) =>
    isNil(key) ? null : state.fills[key] ?? null,
  );
}

export const composerStore = { fill, take, usePendingFill };

export type ComposerFillMode = 'replace' | 'restore';

export type ComposerFill = {
  text: string;
  files: File[];
  mode: ComposerFillMode;
};
