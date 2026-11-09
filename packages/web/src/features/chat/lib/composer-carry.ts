import { create } from 'zustand';

const useComposerCarry = create<ComposerCarryState>(() => ({
  queued: null,
  carried: null,
}));

function reportQueued({ text }: { text: string | null }): void {
  useComposerCarry.setState({ queued: text });
}

function carryQueued(): void {
  const { queued } = useComposerCarry.getState();
  if (queued === null) return;
  useComposerCarry.setState({ queued: null, carried: queued });
}

function peekCarried(): string | null {
  return useComposerCarry.getState().carried;
}

function clearCarried(): void {
  useComposerCarry.setState({ carried: null });
}

type ComposerCarryState = {
  queued: string | null;
  carried: string | null;
};

export const composerCarry = {
  reportQueued,
  carryQueued,
  peekCarried,
  clearCarried,
};
