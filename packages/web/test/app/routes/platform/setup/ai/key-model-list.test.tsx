/**
 * @vitest-environment jsdom
 */
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
} from '@activepieces/shared';
import { fireEvent, render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { KeyModelList } from '@/app/routes/platform/setup/ai/providers-tab/key-model-list';

vi.mock('i18next', () => ({
  t: (key: string, vars?: Record<string, unknown>) =>
    key.replace(/\{(\w+)\}/g, (_, name) => String(vars?.[name] ?? name)),
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectValue: () => null,
  SelectContent: () => null,
  SelectItem: () => null,
}));

const CONFIG: AIProviderWithoutSensitiveData = {
  id: 'key-1',
  name: 'Marketing',
  provider: AIProviderName.OPENAI,
  config: {},
  enabledForChat: false,
  modelScope: 'selected',
  modelIds: ['gpt-main'],
  projectScope: 'all',
  projectIds: [],
  status: 'active',
  statusReason: null,
  statusUpdated: null,
};

const MODELS: AIProviderModel[] = [
  { id: 'gpt-main', name: 'GPT Main', type: AIProviderModelType.TEXT },
  { id: 'gpt-other', name: 'GPT Other', type: AIProviderModelType.TEXT },
  { id: 'gpt-third', name: 'GPT Third', type: AIProviderModelType.TEXT },
];

const renderList = (
  props: Partial<React.ComponentProps<typeof KeyModelList>> = {},
) => {
  const onChange = vi.fn();
  render(
    <KeyModelList
      config={CONFIG}
      models={MODELS}
      staleIds={[]}
      tiersByModel={new Map([['gpt-main', ['Smart']]])}
      selection={{ modelScope: 'selected', modelIds: ['gpt-main'] }}
      isLoading={false}
      onChange={onChange}
      {...props}
    />,
  );
  return { onChange };
};

describe('KeyModelList', () => {
  it('locks a model a tier uses and says which tier', () => {
    renderList();
    const main = screen.getByRole('checkbox', { name: 'GPT Main' });
    expect(main.hasAttribute('disabled')).toBe(true);
    expect(main.getAttribute('data-state')).toBe('checked');
    expect(screen.getByText('Used by Smart')).toBeTruthy();
  });

  it('toggles a free model on', () => {
    const { onChange } = renderList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'GPT Other' }));
    expect(onChange).toHaveBeenCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main', 'gpt-other'],
    });
  });

  it('ticks every model under auto-add and keeps the free ones live', () => {
    renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'all', modelIds: [] },
    });
    const autoAdd = screen.getByRole('switch', {
      name: 'Add new OpenAI models automatically',
    });
    expect(autoAdd.getAttribute('data-state')).toBe('checked');
    const other = screen.getByRole('checkbox', { name: 'GPT Other' });
    expect(other.hasAttribute('disabled')).toBe(false);
    expect(other.getAttribute('data-state')).toBe('checked');
    expect(
      screen
        .getByRole('checkbox', { name: 'GPT Main' })
        .hasAttribute('disabled'),
    ).toBe(true);
  });

  it('leaves auto-add with every other model ticked when one is unticked', () => {
    const { onChange } = renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'all', modelIds: [] },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'GPT Other' }));
    expect(onChange).toHaveBeenCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main', 'gpt-third'],
    });
  });

  it('says new models stop being added once a saved auto-add key leaves it', () => {
    renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'selected', modelIds: ['gpt-main'] },
    });
    expect(
      screen
        .getByRole('switch', { name: 'Add new OpenAI models automatically' })
        .getAttribute('data-state'),
    ).toBe('unchecked');
    expect(
      screen.getByText(
        'New models won’t be added automatically. Turn this on to allow all models again.',
      ),
    ).toBeTruthy();
  });

  it('turns auto-add back on only through the switch', () => {
    const { onChange } = renderList();
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main', 'gpt-other', 'gpt-third'],
    });
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'Add new OpenAI models automatically',
      }),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      modelScope: 'all',
      modelIds: [],
    });
  });

  it('acts on the shown rows only while a search narrows the list', () => {
    const { onChange } = renderList();
    expect(screen.queryByRole('button', { name: 'Select shown' })).toBeNull();
    fireEvent.change(screen.getByPlaceholderText('Search models'), {
      target: { value: 'third' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Select shown' }));
    expect(onChange).toHaveBeenCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main', 'gpt-third'],
    });
  });
});
