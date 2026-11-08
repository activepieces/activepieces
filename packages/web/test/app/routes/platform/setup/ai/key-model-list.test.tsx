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

  it('turns the switch off once a saved auto-add key leaves it', () => {
    renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'selected', modelIds: ['gpt-main'] },
    });
    expect(
      screen
        .getByRole('switch', { name: 'Add new OpenAI models automatically' })
        .getAttribute('data-state'),
    ).toBe('unchecked');
  });

  it('turns auto-add back on only through the switch', () => {
    const { onChange } = renderList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
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
    fireEvent.change(screen.getByPlaceholderText('Search models'), {
      target: { value: 'third' },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    expect(onChange).toHaveBeenCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main', 'gpt-third'],
    });
  });

  it('clears every free model from the header box under auto-add', () => {
    const { onChange } = renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'all', modelIds: [] },
    });
    const header = screen.getByRole('checkbox', { name: 'Select all' });
    expect(header.getAttribute('data-state')).toBe('checked');
    fireEvent.click(header);
    expect(onChange).toHaveBeenCalledWith({
      modelScope: 'selected',
      modelIds: ['gpt-main'],
    });
  });

  it('keeps the selected only filter in place whatever the scope', () => {
    renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      selection: { modelScope: 'all', modelIds: [] },
    });
    expect(screen.getByRole('checkbox', { name: 'Selected only' })).toBeTruthy();
  });

  it('shows only the ticked models under selected only', () => {
    renderList();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Selected only' }));
    expect(screen.getByRole('checkbox', { name: 'GPT Main' })).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'GPT Other' })).toBeNull();
  });

  it('leaves models behind show more alone when the header clears', () => {
    const many: AIProviderModel[] = Array.from({ length: 25 }, (_, index) => ({
      id: `m-${String(index).padStart(2, '0')}`,
      name: `Model ${String(index).padStart(2, '0')}`,
      type: AIProviderModelType.TEXT,
    }));
    const { onChange } = renderList({
      config: { ...CONFIG, modelScope: 'all', modelIds: [] },
      models: many,
      tiersByModel: new Map(),
      selection: { modelScope: 'all', modelIds: [] },
    });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));
    const next = onChange.mock.calls[0][0];
    expect(next.modelScope).toBe('selected');
    expect(next.modelIds).toHaveLength(5);
  });
});
