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

import { AgentConfigurePanel } from '@/app/routes/agents/id/configure-panel';

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
          <AgentConfigurePanel agent={agent} onExit={vi.fn()} />
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

describe('the configure panel never lets two writes race', () => {
  it('issues one write when the form is submitted twice before the first settles', async () => {
    renderScreen();
    typeInInstructions('Sort the inbox differently.');
    await new Promise((resolve) => setTimeout(resolve, 60));

    document.querySelector('form')?.requestSubmit();
    document.querySelector('form')?.requestSubmit();
    await new Promise((resolve) => setTimeout(resolve, 120));

    expect(mutateCalls).toHaveLength(1);
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
});
