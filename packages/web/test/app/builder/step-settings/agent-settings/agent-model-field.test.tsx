/**
 * @vitest-environment jsdom
 */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderName } from '@activepieces/core-utils';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  options: undefined as unknown,
  pickerProps: undefined as
    | { withTiers?: boolean; surface?: string }
    | undefined,
  hookSurface: undefined as string | undefined,
}));

vi.mock('@/features/agents/ai-model/hooks', () => ({
  aiModelHooks: {
    useModelOptions: ({ surface }: { surface: string }) => {
      state.hookSurface = surface;
      return { data: state.options };
    },
  },
}));

vi.mock('@/features/agents/ai-model/model-picker', () => ({
  ModelPicker: (props: { withTiers?: boolean; surface?: string }) => {
    state.pickerProps = props;
    return <div data-testid="model-picker" />;
  },
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {
    useCurrentProject: () => ({ project: { id: 'project-1' } }),
  },
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

import { AgentModelField } from '@/app/builder/step-settings/agent-settings/agent-model-field';

let container: HTMLDivElement;
let root: Root;

function render({
  value,
  onChange,
  pieceVersion = '0.14.1',
  actionName = 'run_agent',
  disabled = false,
  hideHeading,
}: {
  value: unknown;
  onChange: (value: unknown) => void;
  pieceVersion?: string;
  actionName?: string;
  disabled?: boolean;
  hideHeading?: boolean;
}) {
  act(() => {
    root.render(
      <AgentModelField
        value={value}
        onChange={onChange}
        pieceVersion={pieceVersion}
        actionName={actionName}
        disabled={disabled}
        hideHeading={hideHeading}
      />,
    );
  });
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  state.pickerProps = undefined;
  state.options = {
    tiers: [{ id: 'tier-1', name: 'Expert' }],
    credits: { providerConfigId: 'managed', defaultTierId: 'fast', tiers: [] },
    keys: [],
    defaultChoice: { type: 'tier', tierId: 'tier-1' },
    movedTiers: {},
    specificModelsHidden: false,
  };
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('the model field on a Run Agent step', () => {
  it('writes the default once on a new step', () => {
    const onChange = vi.fn();

    render({ value: {}, onChange });
    render({ value: {}, onChange });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ modelTierId: 'tier-1' });
  });

  it('writes nothing in a read-only view', () => {
    const onChange = vi.fn();

    render({ value: {}, onChange, disabled: true });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('writes nothing when the step already has a model', () => {
    const onChange = vi.fn();

    render({
      value: { provider: AIProviderName.OPENAI, model: 'gpt-test' },
      onChange,
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('writes nothing until the options load', () => {
    const onChange = vi.fn();
    state.options = undefined;

    render({ value: {}, onChange });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('hides tiers and says why on a step whose piece cannot send one', () => {
    const onChange = vi.fn();

    render({ value: {}, onChange, pieceVersion: '0.14.0' });

    expect(state.pickerProps?.withTiers).toBe(false);
    expect(container.textContent).toContain(
      'Update this step to the latest version to use your tiers.',
    );
    expect(onChange).toHaveBeenCalledWith({
      provider: AIProviderName.ACTIVEPIECES,
      model: 'fast',
      configId: 'managed',
    });
  });
});

describe('the model field on an AI piece text step', () => {
  it('lists flow models for Ask AI and leaves the heading to its section', () => {
    render({
      value: undefined,
      onChange: vi.fn(),
      pieceVersion: '0.15.0',
      actionName: 'askAi',
    });

    expect(state.hookSurface).toBe('flow');
    expect(state.pickerProps?.surface).toBe('flow');
    expect(state.pickerProps?.withTiers).toBe(true);
    expect(container.textContent).not.toContain('AI Model *');
  });

  it('lists tool-calling models for Extract, which answers through a tool', () => {
    render({
      value: undefined,
      onChange: vi.fn(),
      pieceVersion: '0.15.0',
      actionName: 'extractStructuredData',
    });

    expect(state.pickerProps?.surface).toBe('agent');
  });

  it('writes the default once on a new Summarize step and shows its own heading', () => {
    const onChange = vi.fn();

    render({
      value: undefined,
      onChange,
      pieceVersion: '0.15.0',
      actionName: 'summarizeText',
    });

    expect(onChange).toHaveBeenCalledWith({ modelTierId: 'tier-1' });
    expect(container.textContent).toContain('AI Model *');
  });

  it('drops its heading when the form label above it carries the expression switch', () => {
    render({
      value: undefined,
      onChange: vi.fn(),
      pieceVersion: '0.15.0',
      actionName: 'summarizeText',
      hideHeading: true,
    });

    expect(container.textContent).not.toContain('AI Model *');
  });

  it('never overwrites a model held in an expression', () => {
    const onChange = vi.fn();

    render({
      value: '{{step_1.model}}',
      onChange,
      pieceVersion: '0.15.0',
      actionName: 'askAi',
    });

    expect(onChange).not.toHaveBeenCalled();
  });
});
