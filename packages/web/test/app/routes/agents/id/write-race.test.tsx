// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mutateCalls: { goLive?: boolean }[] = [];

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('@/app/routes/chat-with-ai/ai-chat-box', () => ({
  AIChatBox: () => <div data-testid="chat" />,
}));
vi.mock('@/app/builder/step-settings/agent-settings/agent-tools', () => ({
  AgentTools: () => <div data-testid="tools" />,
}));
vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));
vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));
vi.mock('@/features/agents', () => ({
  AIModelSelector: () => <div data-testid="model" />,
  AgentStructuredOutput: () => <div data-testid="structured" />,
  KnowledgeBaseSection: () => <div data-testid="knowledge" />,
  useAgentsAvailable: () => true,
}));
vi.mock('@/features/agents/hooks/agents-hooks', () => ({
  agentsMutations: {
    useUpdateAgent: () => ({
      isPending: false,
      mutate: (request: { goLive?: boolean }) => {
        mutateCalls.push(request);
      },
    }),
  },
  agentsQueries: { useAgent: () => ({ data: undefined, isLoading: false }) },
}));

import { AgentEditScreen } from '@/app/routes/agents/id';

const agent = {
  id: 'agent_1',
  displayName: 'Inbox agent',
  description: null,
  icon: 'bot',
  color: 'PURPLE',
  projectId: 'proj_1',
  visibility: 'PROJECT',
  sharedWithUserIds: [],
  published: null,
  draft: {
    instructions: 'Sort the inbox.',
    provider: 'openai',
    providerConfigId: null,
    modelName: 'gpt-5',
    maxSteps: 10,
    tools: [],
    structuredOutput: [],
  },
} as never;

const renderScreen = () => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AgentEditScreen agent={agent} onExit={vi.fn()} onEdited={vi.fn()} />
        ),
      },
    ],
    { initialEntries: ['/'] },
  );
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

const clickTestTab = () => {
  const trigger = screen.getByText('Test').closest('[role="tab"]');
  if (!trigger) throw new Error('Test tab not rendered');
  // Radix activates a tab on pointerdown, not click, so a plain .click() is a no-op here.
  for (const type of ['pointerdown', 'mousedown', 'click']) {
    trigger.dispatchEvent(
      new MouseEvent(type, { bubbles: true, cancelable: true, button: 0 }),
    );
  }
  return trigger;
};

const typeInInstructions = (value: string) => {
  const box = document.querySelector('textarea');
  if (!box) throw new Error('instructions textarea not rendered');
  const setter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value',
  )?.set;
  setter?.call(box, value);
  box.dispatchEvent(new Event('input', { bubbles: true }));
};

beforeEach(() => {
  mutateCalls.length = 0;
});
afterEach(cleanup);

describe('the edit screen never lets two writes race', () => {
  const armAndRace = async ({ saveFirst }: { saveFirst: boolean }) => {
    renderScreen();
    typeInInstructions('Sort the inbox differently.');
    await new Promise((resolve) => setTimeout(resolve, 60));

    if (saveFirst) {
      document.querySelector('form')?.requestSubmit();
      clickTestTab();
    } else {
      clickTestTab();
      document.querySelector('form')?.requestSubmit();
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  };

  it('issues one write when Test and Save are both triggered before either settles', async () => {
    await armAndRace({ saveFirst: false });

    // The stage having won is also the harness guard: if the tab intent had never
    // fired there would be no race, and the surviving write would be the save.
    expect(mutateCalls).toHaveLength(1);
    expect(mutateCalls[0]?.goLive).toBe(false);
  });

  it('drops the save rather than queueing it behind the stage', async () => {
    await armAndRace({ saveFirst: false });

    expect(mutateCalls.filter((call) => call.goLive === undefined)).toHaveLength(
      0,
    );
  });

  it('lets the first intent win when the order is reversed', async () => {
    await armAndRace({ saveFirst: true });

    expect(mutateCalls).toHaveLength(1);
    expect(mutateCalls[0]?.goLive).toBeUndefined();
  });

  it('a lone save still goes live, so the lock does not block ordinary use', async () => {
    renderScreen();
    typeInInstructions('Sort the inbox differently.');
    await new Promise((resolve) => setTimeout(resolve, 60));

    document.querySelector('form')?.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(mutateCalls).toHaveLength(1);
    expect(mutateCalls[0]?.goLive).toBeUndefined();
  });

  it('a lone Test stages without publishing', async () => {
    renderScreen();
    typeInInstructions('Sort the inbox differently.');
    await new Promise((resolve) => setTimeout(resolve, 60));

    clickTestTab();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(mutateCalls).toHaveLength(1);
    expect(mutateCalls[0]?.goLive).toBe(false);
  });

  it('does not write at all when Test is pressed with nothing unsaved', async () => {
    renderScreen();
    await new Promise((resolve) => setTimeout(resolve, 60));

    clickTestTab();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(mutateCalls).toHaveLength(0);
  });
});
