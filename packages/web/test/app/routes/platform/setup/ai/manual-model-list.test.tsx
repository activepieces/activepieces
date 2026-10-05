/**
 * @vitest-environment jsdom
 *
 * Regression test for the manual-models panel (Vertex, Custom, Cloudflare Gateway).
 *
 * The panel used to hold plain model id strings, so `config-detail` rebuilt every
 * ProviderModelConfig with `modelType: TEXT` hardcoded. An admin could not mark a
 * model as an image model, and Cloudflare's text-only credential validation then
 * chat-validated the image model and rejected the whole key.
 *
 * Leaf UI (Button, Input, Select) is stubbed; the stubs hand the test the real
 * `onValueChange` / `onChange` the component passes down, exactly as Radix would.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderModelType, ProviderModelConfig } from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => ({
  onValueChange: undefined as undefined | ((value: string) => void),
}));

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, title }: any) => (
    <button onClick={onClick} title={title}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => {
    selectMock.onValueChange = onValueChange;
    return <div>{children}</div>;
  },
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
}));

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { ManualModelList } = await import(
  '@/app/routes/platform/setup/ai/providers-tab/manual-model-list'
);

describe('ManualModelList', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onChange: ReturnType<typeof vi.fn>;

  const render = (models: ProviderModelConfig[]) => {
    onChange = vi.fn();
    act(() => {
      root.render(<ManualModelList models={models} onChange={onChange} />);
    });
  };

  const clickButton = (text: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.includes(text),
    );
    expect(button).toBeDefined();
    act(() => {
      button?.click();
    });
  };

  const typeModelId = (modelId: string) => {
    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, modelId);
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    selectMock.onValueChange = undefined;
  });

  it('adds a model with the type picked in the dropdown', () => {
    render([]);
    typeModelId('openai/gpt-image-2.5-flare');
    act(() => {
      selectMock.onValueChange?.(AIProviderModelType.IMAGE);
    });
    clickButton('Add');

    expect(onChange).toHaveBeenCalledWith([
      {
        modelId: 'openai/gpt-image-2.5-flare',
        modelName: 'openai/gpt-image-2.5-flare',
        modelType: AIProviderModelType.IMAGE,
      },
    ]);
  });

  it('defaults to a text model when the dropdown is untouched', () => {
    render([]);
    typeModelId('openai/gpt-4.1-mini');
    clickButton('Add');

    expect(onChange).toHaveBeenCalledWith([
      {
        modelId: 'openai/gpt-4.1-mini',
        modelName: 'openai/gpt-4.1-mini',
        modelType: AIProviderModelType.TEXT,
      },
    ]);
  });

  it('flips the type of a model that is already saved, keeping its name', () => {
    render([
      {
        modelId: 'openai/gpt-image-2.5-flare',
        modelName: 'Image model',
        modelType: AIProviderModelType.TEXT,
      },
    ]);
    clickButton('Text');

    expect(onChange).toHaveBeenCalledWith([
      {
        modelId: 'openai/gpt-image-2.5-flare',
        modelName: 'Image model',
        modelType: AIProviderModelType.IMAGE,
      },
    ]);
  });
});
