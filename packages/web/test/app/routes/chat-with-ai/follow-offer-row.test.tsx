/**
 * @vitest-environment jsdom
 */
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const panel = vi.hoisted(() => ({
  state: { conversationId: 'c1' },
  openBeside: vi.fn(),
}));

vi.mock('i18next', () => ({
  t: (key: string, values?: Record<string, string>) =>
    key.replace(/\{(\w+)\}/g, (_, name: string) => values?.[name] ?? ''),
}));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: {
    getProjectId: () => 'p1',
    appendProjectRoutePrefix: (path: string) => `/projects/p1${path}`,
  },
}));
vi.mock('@/features/workspace/lib/chat-panel-open', () => ({
  useChatPanel: { getState: () => panel.state },
  chatPanelUtils: { openBeside: panel.openBeside },
}));

import { FollowOfferRow } from '@/app/routes/chat-with-ai/components/follow-offer-row';
import {
  followAlong,
  useFollowAlong,
} from '@/features/chat/lib/follow/follow-along';

const INITIAL = useFollowAlong.getState();

describe('FollowOfferRow', () => {
  beforeEach(() => {
    panel.state.conversationId = 'c1';
    panel.openBeside.mockClear();
    useFollowAlong.setState(INITIAL, true);
  });
  afterEach(cleanup);

  it('offers to open what the AI changed, and opens it beside the chat', () => {
    render(<FollowOfferRow conversationId="c1" />);
    expect(screen.queryByRole('status')).toBeNull();

    act(() =>
      followAlong.offer({
        kind: 'table',
        id: 't1',
        projectId: 'p1',
        name: 'Leads',
      })
    );
    expect(screen.getByRole('status').textContent).toContain(
      'The AI changed Leads. Open it beside the chat?'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(panel.openBeside).toHaveBeenCalledWith({
      route: '/projects/p1/tables/t1',
      push: true,
      name: 'Leads',
    });
    expect(useFollowAlong.getState().offer).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('can be dismissed, and stays out of other chats', () => {
    act(() =>
      followAlong.offer({
        kind: 'agent',
        id: 'a1',
        projectId: 'p1',
        name: 'Triage',
      })
    );
    const { rerender } = render(<FollowOfferRow conversationId="c2" />);
    expect(screen.queryByRole('status')).toBeNull();

    rerender(<FollowOfferRow conversationId="c1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));

    expect(panel.openBeside).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
