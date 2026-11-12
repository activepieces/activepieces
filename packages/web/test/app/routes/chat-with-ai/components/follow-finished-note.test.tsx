/**
 * @vitest-environment jsdom
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FollowFinishedNote } from '@/app/routes/chat-with-ai/components/follow-finished-note';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import {
  ResourceRef,
  resourceRegistry,
} from '@/features/chat/lib/resources/registry';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, role }: React.PropsWithChildren<{ role?: string }>) => (
      <div role={role}>{children}</div>
    ),
  },
  useReducedMotion: () => true,
}));

const TABLE: ResourceRef = {
  kind: 'table',
  id: 't1',
  projectId: 'p1',
  name: 'Leads',
};

describe('FollowFinishedNote', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    followAlong.reset();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('shows the note when a followed edit ends on the page, then hides it', () => {
    renderNote();

    finishEdit();
    expect(screen.getByText('The AI finished editing this table.')).toBeTruthy();

    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText('The AI finished editing this table.')).toBeNull();
  });

  it('starts the note over when another edit ends while it shows', () => {
    renderNote();

    finishEdit();
    act(() => vi.advanceTimersByTime(2000));
    finishEdit();
    act(() => vi.advanceTimersByTime(1000));

    expect(screen.getByText('The AI finished editing this table.')).toBeTruthy();
  });
});

function renderNote() {
  render(
    <MemoryRouter initialEntries={[resourceRegistry.route(TABLE)]}>
      <FollowFinishedNote />
    </MemoryRouter>,
  );
}

function finishEdit() {
  act(() => {
    useFollowAlong.setState({
      phase: 'editing',
      target: TABLE,
      following: true,
    });
  });
  act(() => {
    useFollowAlong.setState({ phase: 'idle' });
  });
}
