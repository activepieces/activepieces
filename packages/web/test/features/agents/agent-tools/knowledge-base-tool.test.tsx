/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderName } from '@activepieces/core-utils';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/agents', () => ({
  PROVIDER_EMBEDDING_MODELS: { openai: 'text-embedding-3-small' },
}));

const chat = vi.hoisted(() => ({ provider: undefined as string | undefined }));

vi.mock('@/features/platform-admin/hooks/ai-provider-hooks', () => ({
  aiProviderQueries: {
    useChatProvider: () => ({
      data:
        chat.provider === undefined ? undefined : { provider: chat.provider },
    }),
  },
}));

vi.mock('@/hooks/flags-hooks', () => ({
  flagsHooks: { useFlag: () => ({ data: true }) },
}));

vi.mock('@/features/agents/agent-tools/knowledge-base-dialog', () => ({
  AgentKnowledgeBaseDialog: () => null,
}));

vi.mock('@/features/agents/agent-tools/stores/knowledge-base-tools', () => ({
  useKnowledgeBaseToolDialogStore: () => ({}),
}));

vi.mock(
  '@/features/agents/agent-tools/components/add-knowledge-base-dropdown',
  () => ({
    AddKnowledgeBaseDropdown: ({
      children,
    }: {
      children?: React.ReactNode;
    }) => <div data-testid="add-knowledge">{children}</div>,
  }),
);

vi.mock('@/features/agents/agent-tools/components/add-row', () => ({
  AddRow: () => null,
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { KnowledgeBaseSection } from '@/features/agents/agent-tools/components/knowledge-base-tool';

let container: HTMLDivElement;
let root: Root;

function render() {
  act(() => {
    root.render(
      <KnowledgeBaseSection
        layout="rows"
        tools={[]}
        allTools={[]}
        removeTool={vi.fn()}
        onToolsUpdate={vi.fn()}
      />,
    );
  });
}

function canAddKnowledge(): boolean {
  return container.querySelector('[data-testid="add-knowledge"]') !== null;
}

beforeEach(() => {
  chat.provider = undefined;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('adding knowledge to an agent', () => {
  it('is offered when the chat key can embed, whatever the step picked', () => {
    chat.provider = AIProviderName.OPENAI;

    render();

    expect(canAddKnowledge()).toBe(true);
  });

  it('is explained when the chat key cannot embed', () => {
    chat.provider = AIProviderName.ANTHROPIC;

    render();

    expect(canAddKnowledge()).toBe(false);
    expect(container.textContent).toContain('requires a provider');
  });

  it('is explained when the project has no chat key', () => {
    render();

    expect(canAddKnowledge()).toBe(false);
  });
});
