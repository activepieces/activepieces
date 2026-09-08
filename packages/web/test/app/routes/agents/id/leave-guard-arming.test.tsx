// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ModelPick = {
  provider?: string;
  model?: string;
  configId?: string;
  picked?: 'user' | 'default';
};

const pendingSaves: { onSuccess?: () => void }[] = [];

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
  AIModelSelector: ({ onChange }: { onChange: (value: ModelPick) => void }) => (
    <>
      <button
        data-testid="model"
        onClick={() =>
          onChange({
            provider: 'openai',
            model: 'gpt-5',
            configId: undefined,
            picked: 'user',
          })
        }
      />
      <button
        data-testid="model-replaced-by-default"
        onClick={() =>
          onChange({
            provider: 'openai',
            model: 'gpt-5-mini',
            configId: undefined,
            picked: 'default',
          })
        }
      />
      <button
        data-testid="model-filled-by-default"
        onClick={() =>
          onChange({
            provider: 'openai',
            model: 'gpt-5',
            configId: undefined,
            picked: 'default',
          })
        }
      />
    </>
  ),
  AgentStructuredOutput: () => <div data-testid="structured" />,
  KnowledgeBaseSection: () => <div data-testid="knowledge" />,
  useAgentsAvailable: () => true,
}));
vi.mock('@/features/agents/hooks/agents-hooks', () => ({
  agentsMutations: {
    useUpdateAgent: () => ({
      isPending: false,
      mutate: (_request: unknown, options?: { onSuccess?: () => void }) => {
        pendingSaves.push({ onSuccess: options?.onSuccess });
      },
    }),
  },
  agentsQueries: { useAgent: () => ({ data: undefined, isLoading: false }) },
}));

import { AgentEditScreen } from '@/app/routes/agents/id';

const agentWithoutModel = {
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
    provider: null,
    providerConfigId: null,
    modelName: null,
    maxSteps: 10,
    tools: [],
    structuredOutput: [],
  },
} as never;

const renderScreen = ({ onExit }: { onExit: () => void }) => {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: (
          <AgentEditScreen
            agent={agentWithoutModel}
            onExit={onExit}
            onEdited={vi.fn()}
          />
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

const clickBack = () => {
  const back = screen.getByLabelText('Back to the agent');
  back.dispatchEvent(new MouseEvent('click', { bubbles: true }));
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

const settle = () => new Promise((resolve) => setTimeout(resolve, 60));

beforeEach(() => {
  pendingSaves.length = 0;
});
afterEach(cleanup);

describe('the leave guard only speaks for edits a person made', () => {
  it('lets you leave after the selector swapped in a model by itself', async () => {
    const onExit = vi.fn();
    renderScreen({ onExit });
    await settle();

    screen.getByTestId('model-replaced-by-default').click();
    await settle();
    clickBack();
    await settle();

    expect(screen.queryByText('Leave without saving?')).toBeNull();
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('keeps a model the selector filled in for a blank agent', async () => {
    renderScreen({ onExit: vi.fn() });
    await settle();
    expect(
      screen.queryByText('Pick a model so this agent can answer.'),
    ).toBeTruthy();

    screen.getByTestId('model-filled-by-default').click();
    await settle();

    expect(screen.queryByText('Pick a model so this agent can answer.')).toBeNull();
  });

  it('still stops you when the model was picked by hand', async () => {
    const onExit = vi.fn();
    renderScreen({ onExit });
    await settle();

    screen.getByTestId('model').click();
    await settle();
    clickBack();
    await settle();

    expect(screen.getByText('Leave without saving?')).toBeTruthy();
    expect(onExit).not.toHaveBeenCalled();
  });

  it('keeps an edit typed while a save was in flight', async () => {
    const onExit = vi.fn();
    renderScreen({ onExit });
    typeInInstructions('First edit.');
    await settle();

    document.querySelector('form')?.requestSubmit();
    await settle();
    expect(pendingSaves).toHaveLength(1);

    typeInInstructions('Second edit, typed while saving.');
    await settle();
    pendingSaves[0]?.onSuccess?.();
    await settle();

    expect(document.querySelector('textarea')?.value).toBe(
      'Second edit, typed while saving.',
    );
    clickBack();
    await settle();
    expect(screen.getByText('Leave without saving?')).toBeTruthy();
  });
});
