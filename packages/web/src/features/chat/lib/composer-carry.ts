import { create } from 'zustand';

const useComposerCarry = create<ComposerCarryState>(() => ({
  queued: null,
  carried: null,
}));

function reportQueued({ message }: { message: CarriedMessage | null }): void {
  useComposerCarry.setState({ queued: message });
}

function carryQueued(): void {
  const { queued } = useComposerCarry.getState();
  if (queued === null) return;
  useComposerCarry.setState({ queued: null, carried: queued });
}

function peekCarried(): CarriedMessage | null {
  return useComposerCarry.getState().carried;
}

function clearCarried(): void {
  useComposerCarry.setState({ carried: null });
}

type CarriedMessage = {
  text: string;
  files: File[];
};

type ComposerCarryState = {
  queued: CarriedMessage | null;
  carried: CarriedMessage | null;
};

export const composerCarry = {
  reportQueued,
  carryQueued,
  peekCarried,
  clearCarried,
};
