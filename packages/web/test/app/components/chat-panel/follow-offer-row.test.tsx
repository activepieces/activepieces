/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  MockInstance,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { FollowAlongController } from '@/app/components/chat-panel/follow-along-controller';
import { FollowOfferRow } from '@/app/routes/chat-with-ai/components/follow-offer-row';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';
import { followHold } from '@/features/chat/lib/follow/follow-hold';
import { chatLayoutUtils } from '@/features/workspace/lib/chat-layout';
import {
  chatPanelUtils,
  useChatPanel,
} from '@/features/workspace/lib/chat-panel-open';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({ toast: vi.fn() }));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'p1',
    getToken: () => 'token',
    getCurrentUserId: () => 'u1',
    getPlatformId: () => 'pl1',
    subscribe: () => () => undefined,
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));

vi.mock('@/components/providers/embed-provider', () => ({
  useEmbedding: () => ({ embedState: { isEmbedded: false } }),
}));

vi.mock('@/features/chat/lib/follow/use-ai-highlight', () => ({
  useAiFieldHighlights: () => undefined,
}));

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
  motion: {
    div: ({ children, className, role }: MotionMock) => (
      <div className={className} role={role}>
        {children}
      </div>
    ),
  },
  useReducedMotion: () => true,
}));

describe('follow-along offer row', () => {
  let openBeside: MockInstance<typeof chatPanelUtils.openBeside>;

  beforeEach(() => {
    followAlong.reset();
    followHold.report({ pressing: false, drafting: false, scrolledUp: false });
    useChatPanel.setState({
      conversationId: 'c1',
      autoFollow: true,
      gateOpen: false,
    });
    openBeside = vi.spyOn(chatPanelUtils, 'openBeside').mockReturnValue(true);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers to open the page while the user is busy on it, and opens nothing', () => {
    renderChat();
    screen.getByLabelText('Page field').focus();

    aiEditsTable();

    expect(screen.getByText('The AI is editing {name}.')).toBeTruthy();
    expect(openBeside).not.toHaveBeenCalled();
  });

  it('opens the page beside the chat from the offer', () => {
    renderChat();
    screen.getByLabelText('Page field').focus();
    aiEditsTable();

    fireEvent.click(screen.getByRole('button', { name: /^Open/ }));

    expect(openBeside).toHaveBeenCalledTimes(1);
    expect(openBeside.mock.calls[0][0]).toMatchObject({ name: 'Leads' });
  });

  it('stops following from the offer', () => {
    renderChat();
    screen.getByLabelText('Page field').focus();
    aiEditsTable();

    fireEvent.click(screen.getByRole('button', { name: 'Stay here' }));

    expect(useFollowAlong.getState().following).toBe(false);
    expect(useFollowAlong.getState().offer).toBeNull();
    expect(openBeside).not.toHaveBeenCalled();
  });

  it('keeps the page in place while focus moves to the offer to answer it', () => {
    renderChat();
    screen.getByLabelText('Page field').focus();
    aiEditsTable();
    const stay = screen.getByRole('button', { name: 'Stay here' });

    act(() => stay.focus());
    fireEvent.click(stay);

    expect(openBeside).not.toHaveBeenCalled();
    expect(useFollowAlong.getState().following).toBe(false);
  });

  it('waits for a quick press on the page without showing the offer', () => {
    renderChat();
    const page = screen.getByText('Page');

    fireEvent.pointerDown(page);
    aiEditsTable();

    expect(screen.queryByText('The AI is editing {name}.')).toBeNull();
    expect(openBeside).not.toHaveBeenCalled();

    fireEvent.pointerUp(page);

    expect(openBeside).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('The AI is editing {name}.')).toBeNull();
  });
});

function renderChat() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/projects/p1/automations']}>
        <FollowAlongController />
        <main>
          <p>Page</p>
          <input aria-label="Page field" />
        </main>
        <div id={chatLayoutUtils.PANEL_ID}>
          <FollowOfferRow />
        </div>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function aiEditsTable() {
  act(() => {
    followAlong.onChunks({
      ctx: { conversationId: 'c1', runId: 'r1', attach: 'sent' },
      chunks: [
        {
          type: 'tool-output-available',
          toolCallId: 'call-1',
          output: {
            content: [{ type: 'text', text: 'done' }],
            _meta: {
              apResource: {
                v: 1,
                kind: 'table',
                id: 't1',
                projectId: 'p1',
                op: 'update',
                label: 'Leads',
              },
            },
          },
        },
      ],
    });
  });
}

type MotionMock = React.PropsWithChildren<{
  className?: string;
  role?: string;
}>;
