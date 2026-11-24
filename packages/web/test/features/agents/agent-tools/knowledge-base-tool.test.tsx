/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderName } from '@activepieces/core-utils';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const source = vi.hoisted(() => ({
  loaded: true,
  provider: null as string | null,
}));

vi.mock(
  '@/features/agents/agent-tools/knowledge-base-dialog/knowledge-base-hooks',
  () => ({
    useKnowledgeBaseEmbeddingSource: () => ({
      data: source.loaded
        ? {
            provider: source.provider,
            modelId: source.provider === null ? null : 'text-embedding-3-small',
          }
        : undefined,
    }),
  }),
);

const viewer = vi.hoisted(() => ({ isAdmin: false }));

vi.mock('@/hooks/authorization-hooks', () => ({
  useIsPlatformAdmin: () => viewer.isAdmin,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
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
  source.loaded = true;
  source.provider = null;
  viewer.isAdmin = false;
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
  it("is offered when the server reports a provider that embeds this project's files", () => {
    source.provider = AIProviderName.OPENAI;

    render();

    expect(canAddKnowledge()).toBe(true);
  });

  it("tells a builder to ask the admin when no key can embed this project's files", () => {
    render();

    expect(canAddKnowledge()).toBe(false);
    expect(container.textContent).toContain('Ask your admin');
    expect(container.querySelector('a')).toBeNull();
  });

  it('links an admin to the Embeddings capability', () => {
    viewer.isAdmin = true;

    render();

    expect(container.querySelector('a')?.getAttribute('href')).toBe(
      '/platform/ai/capabilities',
    );
  });

  it('is not offered before the server answers', () => {
    source.loaded = false;

    render();

    expect(canAddKnowledge()).toBe(false);
  });
});
