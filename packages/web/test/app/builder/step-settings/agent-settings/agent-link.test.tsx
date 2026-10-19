/**
 * @vitest-environment jsdom
 *
 * The agent picker on a Run Agent step is gated on the platform plan. With
 * agents switched on it must offer the project's runnable agents; with them
 * switched off it must not appear at all, because the server refuses a linked
 * run with 402 and a picker that cannot lead anywhere is worse than no picker.
 *
 * Rendered with raw react-dom and React's act, matching the sibling
 * branch-settings test, since @testing-library/react is opted into per file.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderName } from '@activepieces/core-utils';
import { AgentVisibility } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FormProvider, useForm } from 'react-hook-form';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  agentsAvailable: true,
  agents: [] as unknown[],
  isError: false,
  linkedAgent: undefined as unknown,
}));

vi.mock('@/features/agents/hooks/agents-hooks', () => ({
  useAgentsAvailable: () => state.agentsAvailable,
  agentsQueries: {
    useAgents: () => ({
      data: { pages: [{ data: state.agents }] },
      isLoading: false,
      isError: state.isError,
      refetch: vi.fn(),
    }),
    useAgent: () => ({ data: state.linkedAgent }),
  },
}));

vi.mock('@/features/agents/ai-model/hooks', () => ({
  aiModelHooks: {
    useModelOptions: () => ({
      data: {
        tiers: [{ id: 'tier-1', name: 'Expert' }],
        credits: {
          providerConfigId: 'managed',
          defaultTierId: 'fast',
          tiers: [
            { id: 'fast', label: 'Fast' },
            { id: 'premium', label: 'Heavy' },
          ],
        },
        keys: [],
        defaultChoice: null,
        movedTiers: { 'old-tier': 'tier-1' },
        specificModelsHidden: false,
      },
    }),
  },
}));

vi.mock('@/hooks/authorization-hooks', () => ({
  useAuthorization: () => ({ checkAccess: () => true }),
}));

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getProjectId: () => 'project-1' },
}));

vi.mock('@/components/custom/searchable-select', () => ({
  SearchableSelect: ({ options }: { options: { label: string }[] }) => (
    <div data-testid="agent-picker">
      {options.map((option) => option.label).join('|')}
    </div>
  ),
}));

vi.mock('@/components/custom/data-fetch-error-state', () => ({
  DataFetchErrorState: () => <div data-testid="agent-picker-error" />,
}));

vi.mock('@/components/custom/permission-needed-tooltip', () => ({
  PermissionNeededTooltip: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@/components/ui/form', () => ({
  FormItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  FormLabel: ({ children }: { children: React.ReactNode }) => (
    <label>{children}</label>
  ),
}));

vi.mock('react-router-dom', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

vi.mock('sonner', () => ({ toast: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { AgentLink } from '@/app/builder/step-settings/agent-settings/agent-link';

function agent({
  displayName,
  visibility,
}: {
  displayName: string;
  visibility: AgentVisibility;
}) {
  return {
    id: `id-${displayName}`,
    externalId: `ext-${displayName}`,
    displayName,
    visibility,
    isPublished: true,
  };
}

const formValues = vi.hoisted(() => ({
  read: (() => ({})) as () => Record<string, unknown>,
}));

const Harness = ({
  agentId,
  pieceVersion,
}: {
  agentId?: string;
  pieceVersion: string;
}) => {
  const form = useForm({ defaultValues: { settings: { input: { agentId } } } });
  formValues.read = () => form.getValues();
  return (
    <FormProvider {...form}>
      <AgentLink disabled={false} pieceVersion={pieceVersion} />
    </FormProvider>
  );
};

let container: HTMLDivElement;
let root: Root;

function render(agentId?: string, pieceVersion = '0.14.1') {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(<Harness agentId={agentId} pieceVersion={pieceVersion} />);
  });
}

function detach() {
  const button = [...container.querySelectorAll('button')].find(
    (candidate) => candidate.textContent === 'Detach'
  );
  act(() => {
    button?.click();
  });
}

function storedModel(): unknown {
  const settings = formValues.read()['settings'];
  return typeof settings === 'object' &&
    settings !== null &&
    'input' in settings
    ? (settings.input as Record<string, unknown>)['aiProviderModel']
    : undefined;
}

beforeEach(() => {
  state.agentsAvailable = true;
  state.isError = false;
  state.linkedAgent = undefined;
  state.agents = [
    agent({ displayName: 'Ops', visibility: AgentVisibility.PROJECT }),
  ];
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('the agent picker on a Run Agent step', () => {
  it('offers the project agents when the platform has agents switched on', () => {
    render();

    expect(container.querySelector('[data-testid="agent-picker"]')).not.toBe(
      null
    );
    expect(container.textContent).toContain('Ops');
  });

  it('does not render at all when the platform has agents switched off', () => {
    state.agentsAvailable = false;

    render();

    expect(container.querySelector('[data-testid="agent-picker"]')).toBe(null);
    expect(container.textContent).toBe('');
  });

  it('leaves out an agent a flow could never run', () => {
    state.agents = [
      agent({ displayName: 'Ops', visibility: AgentVisibility.PROJECT }),
      agent({ displayName: 'Mine', visibility: AgentVisibility.RESTRICTED }),
    ];

    render();

    expect(container.textContent).toContain('Ops');
    expect(container.textContent).not.toContain('Mine');
  });

  it('treats a blank id as nothing linked, so a fresh step is not told its agent is missing', () => {
    render('');

    expect(container.querySelector('[data-testid="agent-picker"]')).not.toBe(
      null
    );
    expect(container.textContent).not.toContain('cannot run');
  });

  it('says the list failed instead of looking like an empty account', () => {
    state.isError = true;
    state.agents = [];

    render();

    expect(
      container.querySelector('[data-testid="agent-picker-error"]')
    ).not.toBe(null);
  });

  it('names a managed agent model by its tier label, not its tier id', () => {
    state.linkedAgent = linkedAgent({
      provider: AIProviderName.ACTIVEPIECES,
      modelName: 'premium',
    });

    render('ext-Ops');

    expect(container.textContent).toContain('Heavy');
    expect(container.textContent).not.toContain('premium');
  });

  it('shows a model id that is not a tier as it is stored', () => {
    state.linkedAgent = linkedAgent({
      provider: AIProviderName.ACTIVEPIECES,
      modelName: 'anthropic/claude-opus-4.8',
    });

    render('ext-Ops');

    expect(container.textContent).toContain('anthropic/claude-opus-4.8');
  });

  it('names an agent on a platform tier by the tier name, following a move', () => {
    state.linkedAgent = linkedAgent({ modelTierId: 'old-tier' });

    render('ext-Ops');

    expect(container.textContent).toContain('Expert');
  });

  it('keeps the agent tier on the step when it is detached', () => {
    state.linkedAgent = linkedAgent({ modelTierId: 'tier-1' });

    render('ext-Ops');
    detach();

    expect(storedModel()).toEqual({ modelTierId: 'tier-1' });
  });

  it('copies no tier onto a step whose piece version cannot send one', () => {
    state.linkedAgent = linkedAgent({ modelTierId: 'tier-1' });

    render('ext-Ops', '0.14.0');
    detach();

    expect(storedModel()).toBeUndefined();
  });

  it('copies a specific model with its key when detached', () => {
    state.linkedAgent = linkedAgent({
      provider: AIProviderName.OPENAI,
      modelName: 'gpt-test',
      providerConfigId: 'key-1',
    });

    render('ext-Ops');
    detach();

    expect(storedModel()).toEqual({
      provider: AIProviderName.OPENAI,
      model: 'gpt-test',
      configId: 'key-1',
    });
  });
});

function linkedAgent({
  provider = null,
  modelName = null,
  providerConfigId = null,
  modelTierId = null,
}: {
  provider?: AIProviderName | null;
  modelName?: string | null;
  providerConfigId?: string | null;
  modelTierId?: string | null;
}) {
  return {
    id: 'id-Ops',
    draft: null,
    published: {
      provider,
      modelName,
      providerConfigId,
      modelTierId,
      instructions: 'Answer tickets.',
      tools: [],
      structuredOutput: [],
      maxSteps: 10,
    },
  };
}
