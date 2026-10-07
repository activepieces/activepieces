/**
 * @vitest-environment jsdom
 *
 * Regression test for the save path of a manual-models key (Vertex, Custom,
 * Cloudflare Gateway).
 *
 * `ConfigDetail` used to hold model ids and rebuild every ProviderModelConfig
 * on save with `modelType: TEXT` hardcoded, so an admin could not expose an
 * image model — and Cloudflare's text-only credential validation then rejected
 * the whole key. These tests drive the real ManualModelList inside the real
 * ConfigDetail and assert the UpdateAIProviderRequest that leaves the page.
 *
 * Only leaf UI is stubbed. The Select stub renders each item as a button that
 * calls the component's real `onValueChange`, exactly as Radix would.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable testing-library/no-unnecessary-act */
import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderModelType,
  AIProviderWithoutSensitiveData,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectMock = vi.hoisted(() => ({
  onValueChange: undefined as undefined | ((value: string) => void),
}));

vi.mock('i18next', () => ({
  t: (key: string) => key,
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [], isLoading: false }),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, title }: any) => (
    <button onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder }: any) => (
    <input value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));

vi.mock('@/components/ui/label', () => ({
  Label: ({ children }: any) => <label>{children}</label>,
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange }: any) => {
    selectMock.onValueChange = onValueChange;
    return <div>{children}</div>;
  },
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => null,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children, value }: any) => {
    const onValueChange = selectMock.onValueChange;
    return <button onClick={() => onValueChange?.(value)}>{children}</button>;
  },
}));

vi.mock('@/components/custom/delete-dialog', () => ({
  ConfirmationDeleteDialog: () => null,
}));

vi.mock('@/components/custom/leave-without-saving', () => ({
  LeaveWithoutSavingDialog: () => null,
  useWarnBeforeLosingChanges: () => ({ state: 'unblocked' }),
}));

vi.mock('@/app/routes/platform/setup/components/section-header', () => ({
  SectionHeader: () => null,
}));

vi.mock('@/app/routes/platform/setup/ai/providers-tab/key-status', () => ({
  KeyStatusBadge: () => null,
}));

vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/model-selection-panel',
  () => ({ ModelSelectionPanel: () => null }),
);

vi.mock(
  '@/app/routes/platform/setup/ai/providers-tab/project-selection-panel',
  () => ({ ProjectSelectionPanel: () => null }),
);

vi.mock('@/app/routes/platform/setup/ai/providers-tab/provider-logo', () => ({
  ProviderLogo: () => null,
}));

vi.mock('@/features/platform-admin', () => ({
  aiProviderApi: { listModelsForConfig: vi.fn() },
  aiProviderKeys: { configModels: () => ['ai-provider', 'models'] },
}));

vi.mock('@/lib/format-utils', () => ({
  formatUtils: { formatDateToAgo: () => 'just now' },
}));

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const { ConfigDetail } = await import(
  '@/app/routes/platform/setup/ai/providers-tab/config-detail'
);

const TEXT_MODEL = {
  modelId: 'openai/gpt-4.1-mini',
  modelName: 'GPT 4.1 mini',
  modelType: AIProviderModelType.TEXT,
};

const IMAGE_MODEL_ID = 'openai/gpt-image-2.5-flare';

const gatewayConfig: AIProviderWithoutSensitiveData = {
  id: 'ai-provider-1',
  name: 'Cloudflare AI Gateway key',
  provider: AIProviderName.CLOUDFLARE_GATEWAY,
  config: {
    accountId: '1c441b119970086c90b78ad3be4a478f',
    gatewayId: 'my-gateway',
    models: [TEXT_MODEL],
  },
  enabledForChat: false,
  modelScope: 'all',
  modelIds: [TEXT_MODEL.modelId],
  projectScope: 'all',
  projectIds: [],
  status: 'active',
  statusReason: null,
  statusUpdated: null,
};

describe('ConfigDetail save (manual models)', () => {
  let container: HTMLDivElement;
  let root: Root;
  let onSave: ReturnType<typeof vi.fn>;

  const render = () => {
    onSave = vi.fn().mockResolvedValue(undefined);
    act(() => {
      root.render(
        <ConfigDetail
          config={gatewayConfig}
          info={{
            provider: AIProviderName.CLOUDFLARE_GATEWAY,
            name: 'Cloudflare AI Gateway',
            markdown: '',
            logoUrl: '',
          }}
          projects={[]}
          isSaving={false}
          onSave={onSave}
          onDelete={async () => undefined}
          onReplaceCredentials={() => undefined}
          isRechecking={false}
          onRecheck={() => undefined}
          onBack={() => undefined}
        />,
      );
    });
  };

  const clickButton = (text: string) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === text,
    );
    expect(button).toBeDefined();
    act(() => {
      button?.click();
    });
  };

  const flipTypeBadge = (modelId: string) => {
    const chip = Array.from(container.querySelectorAll('span')).find(
      (candidate) => candidate.textContent?.startsWith(modelId),
    );
    const badge = chip?.querySelector<HTMLButtonElement>(
      'button[title="Model Type"]',
    );
    expect(badge).toBeDefined();
    act(() => {
      badge?.click();
    });
  };

  const typeModelId = (modelId: string) => {
    const input = Array.from(container.querySelectorAll('input')).find(
      (candidate) => candidate.placeholder === 'e.g. openai/gpt-4o',
    );
    expect(input).toBeDefined();
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      )?.set;
      setter?.call(input, modelId);
      input?.dispatchEvent(new Event('input', { bubbles: true }));
    });
  };

  const savedRequest = (): UpdateAIProviderRequest => {
    expect(onSave).toHaveBeenCalledTimes(1);
    return onSave.mock.calls[0][0];
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    selectMock.onValueChange = undefined;
  });

  it('sends an added image model as an image model, keeping the existing one intact', () => {
    render();
    typeModelId(IMAGE_MODEL_ID);
    clickButton('Image');
    clickButton('Add');
    clickButton('Save');

    const request = savedRequest();
    expect(request.config).toEqual({
      accountId: '1c441b119970086c90b78ad3be4a478f',
      gatewayId: 'my-gateway',
      models: [
        TEXT_MODEL,
        {
          modelId: IMAGE_MODEL_ID,
          modelName: IMAGE_MODEL_ID,
          modelType: AIProviderModelType.IMAGE,
        },
      ],
    });
    expect(request.modelIds).toEqual([TEXT_MODEL.modelId, IMAGE_MODEL_ID]);
  });

  it('accumulates a retyped model and an added one into the same payload', () => {
    render();
    flipTypeBadge(TEXT_MODEL.modelId);
    typeModelId(IMAGE_MODEL_ID);
    clickButton('Add');
    clickButton('Save');

    const request = savedRequest();
    expect(request.config).toEqual({
      accountId: '1c441b119970086c90b78ad3be4a478f',
      gatewayId: 'my-gateway',
      models: [
        { ...TEXT_MODEL, modelType: AIProviderModelType.IMAGE },
        {
          modelId: IMAGE_MODEL_ID,
          modelName: IMAGE_MODEL_ID,
          modelType: AIProviderModelType.TEXT,
        },
      ],
    });
    expect(request.modelIds).toEqual([TEXT_MODEL.modelId, IMAGE_MODEL_ID]);
  });
});
