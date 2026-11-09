import { isNil } from '@activepieces/core-utils';
import { create } from 'zustand';

import { composerUtils } from './composer-utils';

const usePendingFills = create<{ fills: Record<string, ComposerFill> }>(() => ({
  fills: {},
}));

function fill({ key, text, files }: ComposerFill & { key: string }): void {
  usePendingFills.setState((state) => {
    const previous = state.fills[key];
    return {
      fills: {
        ...state.fills,
        [key]: isNil(previous)
          ? { text, files }
          : {
              text: composerUtils.joinQueued({
                queued: previous.text,
                next: text,
              }),
              files: [...previous.files, ...files],
            },
      },
    };
  });
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

export type ComposerFill = {
  text: string;
  files: File[];
};
