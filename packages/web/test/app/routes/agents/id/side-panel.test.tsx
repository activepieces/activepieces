// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('@/app/components/locked-feature-guard', () => ({
  LockedFeatureGuard: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
vi.mock('@/features/agents', () => ({ useAgentsAvailable: () => true }));
vi.mock('@/features/agents/agent-mark', () => ({ AgentMark: () => null }));
vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { appendProjectRoutePrefix: (path: string) => path },
}));
vi.mock('@/features/agents/hooks/agents-hooks', () => ({
  agentsQueries: {
    useAgent: () => ({
      isLoading: false,
      isError: false,
      data: {
        id: 'agent_1',
        displayName: 'Travel Desk',
        description: null,
        published: { provider: 'openai', modelName: 'gpt-5', tools: [] },
        draft: { provider: 'openai', modelName: 'gpt-5', tools: [] },
      },
    }),
  },
}));
vi.mock('@/app/routes/agents/id/agent-chat-view', () => ({
  AgentChatView: ({ conversationsOpen }: { conversationsOpen: boolean }) => (
    <div data-testid="chat" data-conversations={String(conversationsOpen)} />
  ),
}));
vi.mock('@/app/routes/agents/id/runs', () => ({
  AgentRuns: () => <div data-testid="runs-panel" />,
}));
vi.mock('@/app/routes/agents/id/configure-panel', () => ({
  AgentConfigurePanel: forwardRef<
    { requestExit: () => void },
    { onExit: () => void }
  >(({ onExit }, ref) => {
    useImperativeHandle(ref, () => ({ requestExit: onExit }));
    return <div data-testid="configure-panel" />;
  }),
}));

import { AgentEditorPage } from '@/app/routes/agents/id';

beforeAll(() => {
  window.TransitionEvent = JsdomTransitionEvent;
});
beforeEach(() => {
  setWindowWide(true);
});
afterEach(cleanup);

describe('agent side panel', () => {
  it('keeps the runs panel content while it slides closed, then removes it', async () => {
    renderPage({ path: '/agents/agent_1' });
    click('Runs');
    expect(await screen.findByTestId('runs-panel')).toBeTruthy();

    click('Runs');
    await waitFor(() => expect(sidePanel().className).toContain('w-0'));
    expect(screen.getByTestId('runs-panel')).toBeTruthy();

    finishSlide();
    expect(screen.queryByTestId('runs-panel')).toBeNull();
  });

  it('swaps runs for configure without resizing the panel', async () => {
    renderPage({ path: '/agents/agent_1/runs' });
    expect(await screen.findByTestId('runs-panel')).toBeTruthy();

    click('Configure');
    expect(screen.getByTestId('configure-panel')).toBeTruthy();
    expect(screen.queryByTestId('runs-panel')).toBeNull();
    expect(sidePanel().className).toContain('w-[452px]');
  });

  it('folds the conversations list when a panel opens on a narrow screen', async () => {
    setWindowWide(false);
    renderPage({ path: '/agents/agent_1' });
    expect(conversationsShown()).toBe('true');

    click('Runs');
    await waitFor(() => expect(conversationsShown()).toBe('false'));

    click('Runs');
    await waitFor(() => expect(sidePanel().className).toContain('w-0'));
    finishSlide();
    expect(conversationsShown()).toBe('true');
  });

  it('keeps the conversations list beside a panel on a wide screen', () => {
    renderPage({ path: '/agents/agent_1' });
    click('Configure');
    expect(conversationsShown()).toBe('true');
  });

  it('closes configure from its header button through the panel exit', () => {
    renderPage({ path: '/agents/agent_1' });
    click('Configure');
    expect(sidePanel().className).toContain('w-[452px]');

    click('Configure');
    expect(sidePanel().className).toContain('w-0');
  });
});

function renderPage({ path }: { path: string }) {
  const router = createMemoryRouter(
    [
      { path: '/agents/:agentId', element: <AgentEditorPage /> },
      { path: '/agents/:agentId/runs', element: <AgentEditorPage /> },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

function setWindowWide(wide: boolean) {
  window.matchMedia = (query: string) => ({
    matches: wide,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

function conversationsShown(): string | null {
  return screen.getByTestId('chat').getAttribute('data-conversations');
}

function click(name: string) {
  fireEvent.click(screen.getByRole('button', { name }));
}

function sidePanel(): HTMLElement {
  const panel = document.querySelector('aside');
  if (panel === null) throw new Error('side panel not rendered');
  return panel;
}

function finishSlide() {
  fireEvent.transitionEnd(sidePanel(), { propertyName: 'width' });
}

class JsdomTransitionEvent extends Event {
  readonly propertyName: string;
  readonly elapsedTime = 0;
  readonly pseudoElement = '';
  constructor(type: string, init?: TransitionEventInit) {
    super(type, init);
    this.propertyName = init?.propertyName ?? '';
  }
}
