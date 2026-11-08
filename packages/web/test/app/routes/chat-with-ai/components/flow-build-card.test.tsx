/**
 * @vitest-environment jsdom
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FlowBuildCard } from '@/app/routes/chat-with-ai/components/flow-build-card';
import { BuildState } from '@/features/chat/lib/chat-store';
import {
  ChatStoreProvider,
  useChatStoreApi,
} from '@/features/chat/lib/chat-store-context';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/lib/navigation-utils', () => ({
  useNewWindow: () => vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe('FlowBuildCard', () => {
  it('shows Turn on when built and sends the enable prompt', () => {
    const onSendPrompt = vi.fn();
    renderCard({ build: buildState({ phase: 'done' }), onSendPrompt });

    expect(screen.getByText('Lead greeting')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Turn on' }));

    expect(onSendPrompt).toHaveBeenCalledWith(
      'Publish and enable the automation so it runs live',
    );
    expect(screen.getByRole('button', { name: 'Open in builder' })).toBeTruthy();
  });

  it('shows the steps and no Turn on while building', () => {
    renderCard({
      build: buildState({ phase: 'building' }),
      onSendPrompt: vi.fn(),
    });

    expect(screen.getByText('Add trigger')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Turn on' })).toBe(null);
  });
});

function renderCard({
  build,
  onSendPrompt,
}: {
  build: BuildState;
  onSendPrompt: (text: string) => void;
}) {
  return render(
    <ChatStoreProvider>
      <SeedStore build={build} />
      <FlowBuildCard buildId={build.buildId} onSendPrompt={onSendPrompt} />
    </ChatStoreProvider>,
  );
}

function SeedStore({ build }: { build: BuildState }) {
  const store = useChatStoreApi();
  useState(() => {
    store.setState({ builds: { [build.buildId]: build } });
    return true;
  });
  return null;
}

function buildState({ phase }: { phase: BuildState['phase'] }): BuildState {
  const done = phase === 'done';
  return {
    buildId: 'build-1',
    flowId: 'flow-1',
    flowName: 'Lead greeting',
    projectId: 'project-1',
    phase,
    steps: [
      { id: 's1', label: 'Add trigger', status: done ? 'done' : 'in_progress' },
      { id: 's2', label: 'Send email', status: done ? 'done' : 'pending' },
    ],
    updatedAt: '2026-11-08T10:00:00.000Z',
  };
}
