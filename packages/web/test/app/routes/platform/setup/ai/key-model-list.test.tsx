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

vi.mock('@/app/routes/platform/setup/ai/components/model-detail-row', () => ({
  ModelDetailRow: ({
    name,
    nameSuffix,
  }: {
    name: string;
    nameSuffix: React.ReactNode;
  }) => (
    <span>
      {name}
      {nameSuffix}
    </span>
  ),
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
      allModels={false}
      selectedIds={['gpt-main']}
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
    expect(onChange).toHaveBeenCalledWith(['gpt-main', 'gpt-other']);
  });

  it('shows every model on and locked under All models', () => {
    renderList({ allModels: true, selectedIds: [] });
    const other = screen.getByRole('checkbox', { name: 'GPT Other' });
    expect(other.hasAttribute('disabled')).toBe(true);
    expect(other.getAttribute('data-state')).toBe('checked');
    expect(
      screen.getByText('New models from OpenAI are added automatically.'),
    ).toBeTruthy();
  });
});
